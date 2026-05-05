// src/config/index.js
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Bakong
  BAKONG_ACCOUNT_USERNAME: process.env.BAKONG_ACCOUNT_USERNAME,
  BAKONG_LOCATION: process.env.BAKONG_LOCATION,
  BAKONG_TOKEN: process.env.BAKONG_TOKEN,
  BAKONG_ACCOUNT_NAME: process.env.BAKONG_ACCOUNT_NAME,
  BAKONG_PHONE_NUMBER: process.env.BAKONG_PHONE_NUMBER, // ✅ ADD THIS
  NBC_API_URL: process.env.NBC_API_URL || 'https://api-bakong.nbc.gov.kh',
};

console.log('✅ Config loaded successfully');