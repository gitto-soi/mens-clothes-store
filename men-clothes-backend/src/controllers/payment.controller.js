import { PrismaClient } from '@prisma/client';
import {
  generateKHQR,
  checkPaymentStatus as checkPaymentStatusService,
} from '../services/bakong.service.js';

const prisma = new PrismaClient();

// ── Telegram helper ───────────────────────────────────────
const sendTelegramPaymentConfirmed = async (order) => {
  try {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const itemsList = order.items
      .map(item => {
        const name  = item.product?.name  ?? 'Unknown';
        const size  = item.variant?.size  ?? '';
        const color = item.variant?.color ?? '';
        return `• ${name} (${size}/${color}) x${item.quantity} — $${item.priceAtTime}`;
      })
      .join('\n');

    const customerName  = order.user?.name  ?? 'Unknown';
    const customerEmail = order.user?.email ?? 'N/A';
    const orderId = order.id.slice(0, 8).toUpperCase();
    const time = new Date().toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const message =
      `✅ <b>Payment Confirmed — Order #${orderId}</b>\n\n` +
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

export const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not pending' });
    }

    const qrStillValid =
      order.paymentToken &&
      order.khqrCode &&
      order.qrExpiresAt &&
      new Date(order.qrExpiresAt) > new Date();

    if (qrStillValid) {
      return res.json({
        success: true,
        orderId,
        qrString: order.khqrCode,
        amount: order.totalAmount,
        expiresAt: order.qrExpiresAt,
      });
    }

    const { qrString, md5, expiresAt } = await generateKHQR(orderId, order.totalAmount);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        khqrCode: qrString,
        paymentToken: md5,
        qrExpiresAt: expiresAt,
      },
    });

    res.json({
      success: true,
      orderId,
      qrString,
      amount: order.totalAmount,
      expiresAt,
    });
  } catch (error) {
    console.error('❌ initiatePayment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'PAID') {
      return res.json({ status: 'PAID' });
    }

    if (order.qrExpiresAt && new Date(order.qrExpiresAt) < new Date()) {
      return res.json({ status: 'EXPIRED' });
    }

    if (!order.paymentToken) {
      return res.json({ status: 'PENDING' });
    }

    const result = await checkPaymentStatusService(order.paymentToken);

    if (result.status === 'paid') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      // ✅ Fire Telegram notification on KHQR payment confirmed
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true, variant: true } },
          user: true,
        },
      });
      if (fullOrder) await sendTelegramPaymentConfirmed(fullOrder);

      return res.json({ status: 'PAID' });
    }

    res.json({ status: 'PENDING' });
  } catch (error) {
    console.error('❌ checkPaymentStatus error:', error);
    res.status(500).json({ error: 'Failed to check payment' });
  }
};

export const cancelPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    res.json({ success: true, message: 'Order cancelled and stock restored' });
  } catch (error) {
    console.error('❌ cancelPayment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
};