import { PrismaClient } from '@prisma/client';
import {
  generateKHQR,
  checkPaymentStatus as checkPaymentStatusService,
} from '../services/bakong.service.js';

const prisma = new PrismaClient();

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
      include: {
        items: true, // get items to restore stock
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    await prisma.$transaction([
      // Restore stock for each variant
      ...order.items.map((item) =>
        prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      ),
      // Delete order items
      prisma.orderItem.deleteMany({
        where: { orderId },
      }),
      // Delete order
      prisma.order.delete({
        where: { id: orderId },
      }),
    ]);

    res.json({ success: true, message: 'Order cancelled and stock restored' });
  } catch (error) {
    console.error('❌ cancelPayment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
};