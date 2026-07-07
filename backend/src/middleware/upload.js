/**
 * File Upload Middleware
 *
 * Strategy:
 *   - Production (Cloudinary env vars set): files are streamed directly to
 *     Cloudinary via memoryStorage. No file ever touches the server disk.
 *   - Development (Cloudinary not configured): files are saved to local
 *     ./uploads directory via diskStorage. Behaviour is unchanged from before.
 *
 * Both paths expose the same shape on req.file / req.files so controllers
 * do not need to know which storage backend is active:
 *
 *   req.file.cloudinary   → set in production (has .secure_url, .public_id, etc.)
 *   req.file.path         → set in development (local disk path)
 *   req.file.url          → always set (Cloudinary URL or local relative path)
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import { BusinessLogicError } from './errorHandler.js';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from '../services/cloudinaryService.js';

// ── File filter (shared between both storage strategies) ─────────────────────

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BusinessLogicError(`File type '${file.mimetype}' is not allowed. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`),
      false
    );
  }
};

// ── Storage strategy ──────────────────────────────────────────────────────────

let upload;

if (isCloudinaryConfigured()) {
  // ── Production: in-memory → stream to Cloudinary ─────────────────────────
  // multer keeps the file in RAM (req.file.buffer), then our custom
  // middleware uploads it to Cloudinary. No disk writes.

  const memoryUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: config.upload.maxFileSize },
  });

  /**
   * Wraps a multer field config in a pipeline that:
   *   1. Accepts the file with multer (memory storage)
   *   2. Uploads the buffer to Cloudinary
   *   3. Attaches result to req.file.cloudinary and req.file.url
   */
  const withCloudinary = (multerMiddleware, folder = 'uploads') =>
    (req, res, next) => {
      multerMiddleware(req, res, async (err) => {
        if (err) return next(err);
        if (!req.file && (!req.files || req.files.length === 0)) return next();

        // Handle single file
        if (req.file) {
          try {
            const result = await uploadToCloudinary(req.file.buffer, {
              folder,
              mimetype: req.file.mimetype,
              filename: req.file.originalname,
            });
            req.file.cloudinary = result;
            req.file.url = result.secure_url;
          } catch (uploadErr) {
            return next(uploadErr);
          }
        }

        // Handle multiple files (req.files array)
        if (Array.isArray(req.files) && req.files.length > 0) {
          try {
            await Promise.all(
              req.files.map(async (f) => {
                const result = await uploadToCloudinary(f.buffer, {
                  folder,
                  mimetype: f.mimetype,
                  filename: f.originalname,
                });
                f.cloudinary = result;
                f.url = result.secure_url;
              })
            );
          } catch (uploadErr) {
            return next(uploadErr);
          }
        }

        next();
      });
    };

  upload = {
    single: (fieldName, folder = 'uploads') =>
      withCloudinary(memoryUpload.single(fieldName), folder),

    array: (fieldName, maxCount = 5, folder = 'uploads') =>
      withCloudinary(memoryUpload.array(fieldName, maxCount), folder),

    fields: (fields, folder = 'uploads') =>
      withCloudinary(memoryUpload.fields(fields), folder),

    none: () => memoryUpload.none(),

    // Convenience wrappers with pre-set folders
    profileImage: (fieldName = 'profileImage') =>
      withCloudinary(memoryUpload.single(fieldName), 'profile-images'),

    idDocument: (fieldName = 'idDocument') =>
      withCloudinary(memoryUpload.single(fieldName), 'id-documents'),

    medicalDocument: (fieldName = 'document') =>
      withCloudinary(memoryUpload.single(fieldName), 'medical-documents'),

    licenseDocument: (fieldName = 'license') =>
      withCloudinary(memoryUpload.single(fieldName), 'licenses'),
  };

} else {
  // ── Development: local disk storage (unchanged behaviour) ─────────────────

  const uploadDir = config.upload.uploadDir || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

  const diskUpload = multer({
    storage: diskStorage,
    fileFilter,
    limits: { fileSize: config.upload.maxFileSize },
  });

  // Attach a local .url to match the Cloudinary path shape
  const withLocalUrl = (middleware) => (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return next(err);
      if (req.file) {
        req.file.url = `/uploads/${path.basename(req.file.path)}`;
      }
      if (Array.isArray(req.files)) {
        req.files.forEach((f) => {
          f.url = `/uploads/${path.basename(f.path)}`;
        });
      }
      next();
    });
  };

  upload = {
    single: (fieldName) => withLocalUrl(diskUpload.single(fieldName)),
    array: (fieldName, maxCount = 5) => withLocalUrl(diskUpload.array(fieldName, maxCount)),
    fields: (fields) => withLocalUrl(diskUpload.fields(fields)),
    none: () => diskUpload.none(),

    // Dev convenience aliases (same as single, folder is irrelevant locally)
    profileImage: (fieldName = 'profileImage') => withLocalUrl(diskUpload.single(fieldName)),
    idDocument: (fieldName = 'idDocument') => withLocalUrl(diskUpload.single(fieldName)),
    medicalDocument: (fieldName = 'document') => withLocalUrl(diskUpload.single(fieldName)),
    licenseDocument: (fieldName = 'license') => withLocalUrl(diskUpload.single(fieldName)),
  };
}

export default upload;
