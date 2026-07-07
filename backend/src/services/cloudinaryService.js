/**
 * Cloudinary Upload Service
 *
 * Provides cloud file storage for production deployments.
 * Falls back to local disk storage when Cloudinary env vars are not set
 * (development mode), so local dev workflow is unchanged.
 *
 * Usage:
 *   import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from './cloudinaryService.js';
 *
 *   // Upload a file buffer
 *   const result = await uploadToCloudinary(buffer, { folder: 'patients', publicId: 'doc-123' });
 *   console.log(result.secure_url);  // https://res.cloudinary.com/...
 *
 *   // Delete a file
 *   await deleteFromCloudinary('lifeline-pro/patients/doc-123');
 *
 * Required env vars (production):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_UPLOAD_FOLDER  (optional, default: 'lifeline-pro')
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import logger from '../utils/logger.js';

// ── Configuration ─────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const BASE_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'lifeline-pro';

/**
 * Returns true when all three Cloudinary env vars are present.
 * Used by upload middleware to decide local vs cloud storage.
 */
export const isCloudinaryConfigured = () =>
  Boolean(CLOUD_NAME && API_KEY && API_SECRET);

// Only configure the SDK when the vars exist - avoids noisy warnings in dev
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  logger.info('Cloudinary configured — file uploads will use cloud storage');
} else {
  logger.info('Cloudinary not configured — file uploads will use local disk (dev mode)');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a Buffer to a Readable stream.
 * Cloudinary's upload_stream API requires a stream, not a buffer.
 */
function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Determine the correct Cloudinary resource_type for a given MIME type.
 *   image/*        → 'image'
 *   application/pdf → 'raw'  (PDFs must use 'raw' for reliable delivery)
 *   everything else → 'auto'
 */
function getResourceType(mimetype) {
  if (mimetype?.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'raw';
  return 'auto';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer - File contents
 * @param {object} options
 * @param {string} [options.folder]      - Sub-folder under BASE_FOLDER  e.g. 'patients'
 * @param {string} [options.publicId]    - Explicit public_id (no extension)
 * @param {string} [options.mimetype]    - Original MIME type, used to pick resource_type
 * @param {string} [options.filename]    - Original filename (for raw/pdf display names)
 * @returns {Promise<{secure_url: string, public_id: string, resource_type: string, bytes: number, format: string}>}
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const {
    folder = 'uploads',
    publicId,
    mimetype,
    filename,
  } = options;

  const resourceType = getResourceType(mimetype);
  const cloudFolder = `${BASE_FOLDER}/${folder}`;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: cloudFolder,
      resource_type: resourceType,
      overwrite: true,
      // Keep original filename visible in Cloudinary dashboard for PDFs/raw
      ...(filename && resourceType === 'raw' && { use_filename: true, unique_filename: true }),
      // Explicit public_id overrides auto-generated one
      ...(publicId && { public_id: publicId }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', {
            error: error.message,
            folder: cloudFolder,
            mimetype,
          });
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        logger.info('File uploaded to Cloudinary', {
          public_id: result.public_id,
          bytes: result.bytes,
          resource_type: result.resource_type,
        });
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by its public_id.
 *
 * @param {string} publicId - Cloudinary public_id (including folder path)
 * @param {string} [resourceType='image'] - 'image', 'raw', or 'video'
 * @returns {Promise<{result: string}>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) {
    logger.warn('Cloudinary not configured — skipping delete', { publicId });
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    logger.info('File deleted from Cloudinary', { publicId, result: result.result });
    return result;
  } catch (error) {
    logger.error('Cloudinary delete failed', { error: error.message, publicId });
    throw error;
  }
};

/**
 * Generate a Cloudinary URL with optional transformations.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {object} [transformations] - Cloudinary transformation options
 * @returns {string} Secure URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!isCloudinaryConfigured()) return null;
  return cloudinary.url(publicId, { secure: true, ...transformations });
};

export default {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
};
