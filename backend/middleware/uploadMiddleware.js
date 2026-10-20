import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadInterviewVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
});

export const handleMulterError = (err, req, res, next) => {
  if (!err) return next();
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
    success: false,
    message: err.message || 'File upload error'
  });
};
