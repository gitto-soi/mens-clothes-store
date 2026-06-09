-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contactMethod" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "shippingAddress" JSONB;
