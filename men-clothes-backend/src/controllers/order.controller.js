import { PrismaClient } from '@prisma/client';
import * as orderService from '../services/order.service.js';

const prisma = new PrismaClient();

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
        items: { include: { product: true, variant: true } },
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
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// ✅ Telegram fires here for PAID/SHIPPED/DELIVERED via updateOrderStatus service
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await orderService.updateOrderStatus(id, status);
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
        items: { include: { product: true, variant: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};