import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create an order from cart items
export const createOrder = async (userId, items, totalAmount) => {
  // Start a transaction to ensure everything succeeds or fails together
  return prisma.$transaction(async (tx) => {
    // 1. Check stock availability and reserve items
    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.product.name} - ${variant.size} ${variant.color}`);
      }
    }

    // 2. Deduct stock
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. Create order with items
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceAtTime: item.price,
          })),
        },
      },
      include: { items: { include: { product: true, variant: true } } },
    });

    return order;
  });
};

// Get all orders for a user
export const getUserOrders = async (userId) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// Get single order by ID (user must own it or be admin)
export const getOrderById = async (orderId, userId, isAdmin = false) => {
  const where = { id: orderId };
  if (!isAdmin) where.userId = userId;
  return prisma.order.findFirst({
    where,
    include: { items: { include: { product: true, variant: true } }, user: true },
  });
};

// Update order status (admin or payment webhook)
export const updateOrderStatus = async (orderId, status) => {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};

// Delete an order (only if status is PENDING, for development)
export const deleteOrder = async (orderId, userId, isAdmin) => {
  // Fetch order with its items
  const order = await prisma.order.findFirst({
    where: isAdmin ? { id: orderId } : { id: orderId, userId },
    include: { items: true },   // ← this was missing
  });
  if (!order) throw new Error('Order not found');
  if (order.status !== 'PENDING') {
    throw new Error('Only pending orders can be deleted');
  }

  // Restore stock for each order item
  for (const item of order.items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }

  // Delete order items then order
  await prisma.orderItem.deleteMany({ where: { orderId } });
  return prisma.order.delete({ where: { id: orderId } });
};

// Cancel an order (by user) – restore stock
export const cancelOrder = async (orderId, userId) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: 'PENDING' },
    include: { items: true },
  });
  if (!order) throw new Error('Order not found or cannot be cancelled');
  for (const item of order.items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
  return prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
};

// Expire pending orders older than 15 minutes – run via cron or on demand
export const expirePendingOrders = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const expiredOrders = await prisma.order.findMany({
    where: { status: 'PENDING', createdAt: { lt: fifteenMinutesAgo } },
    include: { items: true },
  });
  for (const order of expiredOrders) {
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
  }
  return expiredOrders.length;
};

export const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      items: { include: { product: true, variant: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};