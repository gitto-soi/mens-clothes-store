import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      phone: '0963659813',
      password: adminPassword,
      name: 'Admin Store',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Create categories
  const categories = [
    { name: 'T-Shirts' },
    { name: 'Jeans' },
    { name: 'Hoodies' },
    { name: 'Jackets' },
    { name: 'Shorts' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // 3. Create brands
  const brands = [
    { name: 'Nike' },
    { name: 'Adidas' },
    { name: 'Uniqlo' },
    { name: 'H&M' },
    { name: 'Zara' },
  ];
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: brand,
    });
  }
  console.log('✅ Brands created');

  // 4. Get IDs for relationships
  const tshirtCat = await prisma.category.findUnique({ where: { name: 'T-Shirts' } });
  const jeansCat = await prisma.category.findUnique({ where: { name: 'Jeans' } });
  const nikeBrand = await prisma.brand.findUnique({ where: { name: 'Nike' } });
  const adidasBrand = await prisma.brand.findUnique({ where: { name: 'Adidas' } });

  // 5. Create sample products with variants
  const products = [
    {
      name: 'Nike Sport T-Shirt',
      description: 'Breathable cotton t-shirt for everyday wear.',
      price: 29.99,
      categoryId: tshirtCat.id,
      brandId: nikeBrand.id,
      images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
      variants: [
        { size: 'S', color: 'White', stock: 10, sku: 'NK-TS-WHT-S' },
        { size: 'M', color: 'White', stock: 20, sku: 'NK-TS-WHT-M' },
        { size: 'L', color: 'White', stock: 15, sku: 'NK-TS-WHT-L' },
        { size: 'XL', color: 'Black', stock: 8, sku: 'NK-TS-BLK-XL' },
      ],
    },
    {
      name: 'Adidas Originals Hoodie',
      description: 'Classic hoodie with kangaroo pocket.',
      price: 59.99,
      categoryId: (await prisma.category.findUnique({ where: { name: 'Hoodies' } })).id,
      brandId: adidasBrand.id,
      images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      variants: [
        { size: 'M', color: 'Gray', stock: 12, sku: 'AD-HD-GRY-M' },
        { size: 'L', color: 'Gray', stock: 9, sku: 'AD-HD-GRY-L' },
        { size: 'XL', color: 'Black', stock: 5, sku: 'AD-HD-BLK-XL' },
      ],
    },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: prod.categoryId,
          brandId: prod.brandId,
          images: prod.images,
          variants: { create: prod.variants },
        },
      });
    }
  }
  console.log('✅ Sample products created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });