import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAddressesByUser = async (userId) => {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
};

export const createAddress = async (userId, data) => {
  const { isDefault, ...rest } = data;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { userId, ...rest, isDefault: isDefault || false } });
};

export const updateAddress = async (addressId, userId, data) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new Error('Address not found');
  const { isDefault, ...rest } = data;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id: addressId }, data: { ...rest, isDefault: isDefault || false } });
};

export const deleteAddress = async (addressId, userId) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new Error('Address not found');
  return prisma.address.delete({ where: { id: addressId } });
};

export const setDefaultAddress = async (addressId, userId) => {
  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
};