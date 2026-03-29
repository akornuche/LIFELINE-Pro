import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import { BusinessLogicError } from './errorHandler.js';

/**
 * File Upload Middleware
 * Configures multer for different types of uploads
 */

// Ensure upload directory exists
const uploadDir = config.upload.uploadDir || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BusinessLogicError(`File type '${file.mimetype}' is not allowed`), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export default upload;
