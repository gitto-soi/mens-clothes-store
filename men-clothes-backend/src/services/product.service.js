import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProduct = async (data, imageUrls) => {
  // Generate SKU for each variant if missing
  const variantsWithSku = data.variants.map(v => {
    if (!v.sku) {
      // Example: "LEV-501-BLUE-32" (brand-product-color-size)
      const brandCode = data.name.substring(0, 3).toUpperCase();
      const colorCode = v.color.substring(0, 3).toUpperCase();
      v.sku = `${brandCode}-${colorCode}-${v.size}`.replace(/\s/g, '');
    }
    return v;
  });

  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      categoryId: data.categoryId,
      brandId: data.brandId,
      images: imageUrls,
      variants: {
        create: variantsWithSku.map(v => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: v.sku,
        })),
      },
    },
    include: { variants: true, category: true, brand: true },
  });
};

export const getAllProducts = async (filters) => {
  const { categoryId, brandId, size, minPrice, maxPrice, search } = filters;

  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  // If size filter, we need to join variants
  let includeVariants = {};
  if (size) {
    includeVariants = {
      variants: {
        where: { size },
      },
    };
  } else {
    includeVariants = { variants: true };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      brand: true,
      variants: includeVariants.variants ? includeVariants.variants : true,
    },
  });

  // Filter by size (since Prisma doesn't filter parent by child easily)
  if (size) {
    return products.filter(p => p.variants.length > 0);
  }
  return products;
};

export const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, variants: true },
  });
};

export const updateProduct = async (id, data, newImageUrls) => {
  console.log('=== UPDATE PRODUCT ===');
  console.log('Received data.variants:', data.variants);
  console.log('Type of variants:', typeof data.variants);

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  });
  if (!existing) throw new Error('Product not found');

  // Merge images
  const allImages = [...existing.images, ...newImageUrls];

  // Update basic info
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      categoryId: data.categoryId,
      brandId: data.brandId,
      images: allImages,
    },
  });

  // If variants provided, replace them with auto‑generated SKU
  if (data.variants && Array.isArray(data.variants)) {
    console.log('Variants is array, length:', data.variants.length);
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    const variantsWithSku = data.variants.map(v => {
      console.log('Processing variant:', v);
      if (!v.sku) {
        const brandCode = (data.name || existing.name).substring(0, 3).toUpperCase();
        const colorCode = v.color.substring(0, 3).toUpperCase();
        v.sku = `${brandCode}-${colorCode}-${v.size}`.replace(/\s/g, '');
        console.log('Generated SKU:', v.sku);
      }
      return v;
    });

    await prisma.productVariant.createMany({
      data: variantsWithSku.map(v => ({
        productId: id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        sku: v.sku,
      })),
    });
  } else {
    console.log('Variants not provided or not array:', data.variants);
  }

  return prisma.product.findUnique({
    where: { id },
    include: { variants: true, category: true, brand: true },
  });
};

export const deleteProduct = async (id) => {
  // First delete all variants (order items might reference them)
  await prisma.productVariant.deleteMany({ where: { productId: id } });
  // Then delete the product
  return prisma.product.delete({ where: { id } });
};

// Get all categories (for filters)
export const getAllCategories = async () => {
  return prisma.category.findMany();
};

export const getAllBrands = async () => {
  return prisma.brand.findMany();
};