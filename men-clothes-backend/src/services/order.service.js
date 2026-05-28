import { PrismaClient } from '@prisma/client';
import {
  notifyOrderPlaced,
  notifyOrderPaid,
  notifyOrderShipped,
  notifyOrderDelivered,
} from './telegram.service.js';

const prisma = new PrismaClient();

export const createOrder = async (userId, items, totalAmount) => {
  return prisma.$transaction(async (tx) => {
    // 1. Check stock
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

    // 3. Create order
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
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
      },
    });

    // 4. Notify Telegram
    notifyOrderPlaced(order).catch(() => {});

    return order;
  });
};

export const getUserOrders = async (userId) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (orderId, userId, isAdmin = false) => {
  const where = { id: orderId };
  if (!isAdmin) where.userId = userId;
  return prisma.order.findFirst({
    where,
    include: { items: { include: { product: true, variant: true } }, user: true },
  });
};

// ✅ Notify on PAID, SHIPPED, DELIVERED
export const updateOrderStatus = async (orderId, status) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: { include: { product: true, variant: true } },
      user: true,
    },
  });

  if (status === 'PAID') notifyOrderPaid(order).catch(() => {});
  if (status === 'SHIPPED') notifyOrderShipped(order).catch(() => {});
  if (status === 'DELIVERED') notifyOrderDelivered(order).catch(() => {});

  return order;
};

export const deleteOrder = async (orderId, userId, isAdmin) => {
  const order = await prisma.order.findFirst({
    where: isAdmin ? { id: orderId } : { id: orderId, userId },
    include: { items: true },
  });
  if (!order) throw new Error('Order not found');
  if (order.status !== 'PENDING') {
    throw new Error('Only pending orders can be deleted');
  }

  for (const item of order.items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }

  await prisma.orderItem.deleteMany({ where: { orderId } });
  return prisma.order.delete({ where: { id: orderId } });
};

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