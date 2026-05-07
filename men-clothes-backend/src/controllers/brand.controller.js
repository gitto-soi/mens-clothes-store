import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(brands);
  } catch (error) {
    console.error('getAllBrands error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

// Get single brand
export const getBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
        _count: { select: { products: true } },
      },
    });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (error) {
    console.error('getBrand error:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};

// Create brand (admin only)
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    const brand = await prisma.brand.create({
      data: { name: name.trim() },
    });
    res.status(201).json(brand);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Brand name already exists' });
    }
    console.error('createBrand error:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
};

// Update brand (admin only)
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    const brand = await prisma.brand.update({
      where: { id },
      data: { name: name.trim() },
    });
    res.json(brand);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Brand name already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Brand not found' });
    }
    console.error('updateBrand error:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
};

// Delete brand (admin only)
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if brand has products before deleting
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (brand._count.products > 0) {
      return res.status(400).json({
        error: 'Cannot delete brand with existing products. Please delete or reassign products first.',
      });
    }

    await prisma.brand.delete({ where: { id } });
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('deleteBrand error:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
};