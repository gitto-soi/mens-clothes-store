import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getWishlist = async (userId) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          variants: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return wishlist.map((item) => item.product);
};

export const addToWishlist = async (userId, productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {},
    create: {
      userId,
      productId,
    },
  });

  return { message: 'Added to wishlist' };
};

export const removeFromWishlist = async (userId, productId) => {
  await prisma.wishlist.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  return { message: 'Removed from wishlist' };
};