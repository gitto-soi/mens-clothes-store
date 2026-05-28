import { PrismaClient } from '@prisma/client';
import * as orderService from '../services/order.service.js';

const prisma = new PrismaClient();

// ── Telegram helper ───────────────────────────────────────
const sendTelegramNotification = async (order, status) => {
  try {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const statusConfig = {
      PAID:      { emoji: '✅', label: 'Payment Confirmed' },
      SHIPPED:   { emoji: '🚚', label: 'Order Shipped' },
      DELIVERED: { emoji: '📬', label: 'Order Delivered' },
    };

    const { emoji, label } = statusConfig[status] || { emoji: '📋', label: 'Order Updated' };

    const itemsList = order.items
      .map(item => {
        const name  = item.product?.name  ?? 'Unknown';
        const size  = item.variant?.size  ?? '';
        const color = item.variant?.color ?? '';
        return `• ${name} (${size}/${color}) x${item.quantity} — $${item.priceAtTime}`;
      })
      .join('\n');

    const customerName = order.user?.name ?? 'Unknown';
    const customerEmail = order.user?.email ?? 'N/A';
    const orderId = order.id.slice(0, 8).toUpperCase();
    const time = new Date().toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const message =
      `${emoji} <b>${label} — Order #${orderId}</b>\n\n` +
      `👤 Customer: ${customerName}\n` +
      `📧 Email: ${customerEmail}\n\n` +
      `📦 Items:\n${itemsList}\n\n` +
      `💰 Total: <b>$${order.totalAmount}</b>\n` +
      `🕐 Time: ${time}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        parse_mode: 'HTML',
        text:       message,
      }),
    });

  } catch (err) {
    console.warn('Telegram notification failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────

export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    const order = await orderService.createOrder(userId, items, totalAmount);
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ Hides PENDING KHQR orders that were never paid
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        NOT: {
          AND: [
            { status: 'PENDING' },
            { khqrCode: { not: null } },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';
    const order = await orderService.getOrderById(id, req.user.id, isAdmin);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await orderService.updateOrderStatus(id, status);

    // ✅ Send Telegram when admin marks as PAID, SHIPPED, or DELIVERED
    if (['PAID', 'SHIPPED', 'DELIVERED'].includes(status)) {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true, variant: true } },
          user: true,
        },
      });
      if (fullOrder) await sendTelegramNotification(fullOrder, status);
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';
    const result = await orderService.deleteOrder(id, req.user.id, isAdmin);
    res.json({ message: 'Order deleted successfully', order: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const cancelled = await orderService.cancelOrder(id, userId);
    res.json({ message: 'Order cancelled', order: cancelled });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Hide unpaid KHQR ghost orders from admin too
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        NOT: {
          AND: [
            { status: 'PENDING' },
            { khqrCode: { not: null } },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};