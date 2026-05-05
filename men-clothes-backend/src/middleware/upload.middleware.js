import multer from 'multer';

// Store in memory (buffer) before sending to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.mimetype);
  if (extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});