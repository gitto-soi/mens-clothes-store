import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service.js';
import * as productService from '../services/product.service.js';

const prisma = new PrismaClient();

const extractPublicId = (url) => {
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let afterUpload = url.substring(uploadIndex + 8);
    const parts = afterUpload.split('/');
    if (parts[0] && parts[0].startsWith('v')) parts.shift();
    const fullPath = parts.join('/');
    const lastDot = fullPath.lastIndexOf('.');
    const publicId = lastDot !== -1 ? fullPath.substring(0, lastDot) : fullPath;
    return publicId;
  } catch (e) {
    console.error('Failed to extract public ID from URL:', url, e);
    return null;
  }
};

export const createProduct = async (req, res) => {
  try {
    if (req.body.variants && typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid variants JSON', details: e.message });
      }
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const uploadedImages = [];
    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer, 'products');
      uploadedImages.push(result.url);
    }

    const variants = req.body.variants;
    if (!Array.isArray(variants)) {
      return res.status(400).json({ error: 'Variants must be an array' });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      categoryId: req.body.categoryId,
      brandId: req.body.brandId,
      variants,
    };
    const product = await productService.createProduct(productData, uploadedImages);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const filters = req.query;
    const products = await productService.getAllProducts(filters);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.body.variants && typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid variants JSON', details: e.message });
      }
    }

    const { id } = req.params;
    const variants = req.body.variants;

    // 1. Upload new images if any
    let newImageUrls = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'products');
        newImageUrls.push(result.url);
      }
    }

    // 2. Parse kept existing images
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        console.error('Failed to parse existingImages:', e);
      }
    }

    // 3. Delete removed images from Cloudinary
    if (req.body.removedImages) {
      try {
        const removedImages = JSON.parse(req.body.removedImages);
        for (const url of removedImages) {
          const publicId = extractPublicId(url);
          if (publicId) {
            await deleteFromCloudinary(publicId).catch(err =>
              console.error(`Failed to delete ${publicId}:`, err)
            );
          }
        }
      } catch (e) {
        console.error('Failed to parse removedImages:', e);
      }
    }

    // 4. Final images = kept + newly uploaded
    const finalImages = [...existingImages, ...newImageUrls];

    // 5. Get existing variants from DB to compare
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: id },
    });

    const existingVariantIds = existingVariants.map(v => v.id);
    const incomingVariantIds = variants.filter(v => v.id).map(v => v.id);

    // 6. Only delete variants not referenced by any OrderItem
    const variantIdsToDelete = existingVariantIds.filter(
      vid => !incomingVariantIds.includes(vid)
    );

    if (variantIdsToDelete.length > 0) {
      const referencedItems = await prisma.orderItem.findMany({
        where: { variantId: { in: variantIdsToDelete } },
        select: { variantId: true },
      });
      const referencedIds = referencedItems.map(i => i.variantId);
      const safeToDelete = variantIdsToDelete.filter(vid => !referencedIds.includes(vid));

      if (safeToDelete.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: safeToDelete } },
        });
      }
    }

    // 7. Update product basic info + images
    await prisma.product.update({
      where: { id },
      data: {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        categoryId: req.body.categoryId,
        brandId: req.body.brandId,
        images: finalImages,
      },
    });

    // 8. Upsert variants — update if has id, create if new
    for (const variant of variants) {
      if (variant.id && existingVariantIds.includes(variant.id)) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            size: variant.size,
            color: variant.color,
            stock: variant.stock ?? 0,
            sku: variant.sku || null,
          },
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: id,
            size: variant.size,
            color: variant.color,
            stock: variant.stock ?? 0,
            sku: variant.sku || null,
          },
        });
      }
    }

    // 9. Return full updated product
    const result = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true, brand: true },
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await productService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getBrands = async (req, res) => {
  try {
    const brands = await productService.getAllBrands();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Category already exists' });
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required' });
    const existing = await prisma.brand.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Brand already exists' });
    const brand = await prisma.brand.create({ data: { name } });
    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
};