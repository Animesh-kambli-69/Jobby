import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const videoStorage = multer.memoryStorage();

const videoFileFilter = (req, file, cb) => {
  const allowedVideoTypes = [
    'video/webm',
    'video/mp4',
    'video/ogg',
    'video/quicktime'
  ];

  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video type. Only WEBM, MP4, OGG, and MOV files are allowed.'), false);
  }
};

export const uploadInterviewVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024
  }
});

export const handleMulterError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Uploaded file is too large. Max allowed size is 200MB.'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || 'File upload failed'
  });
};
