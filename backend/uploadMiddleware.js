const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

/**
 * Create a multer upload middleware that stores files in Cloudinary.
 *
 * @param {string} folder   Cloudinary folder (e.g. 'tedx-team-members')
 * @param {string|null} fixedPublicId  If set, every upload uses this exact public_id
 *                                      (useful for logos). If null, the slug from
 *                                      req.body.slug is used as the public_id.
 */
function createUpload(folder, fixedPublicId = null) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req) => {
      // Use slug from the request body as the stable public_id.
      // For logos, use the pre-defined stable ID instead.
      const publicId = fixedPublicId || (req.body && req.body.slug) || undefined;

      return {
        folder,
        // Store the original full-quality file in Cloudinary.
        // Transformations (resize, format, quality) are applied at DELIVERY
        // time via the URL, NOT at upload time. This preserves the original
        // so images don't get double-compressed.
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
        public_id: publicId,
        // Overwrite the asset if the same public_id already exists.
        overwrite: true,
        // Invalidate the CDN cache so the new image is served immediately.
        invalidate: true,
      };
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter(_req, file, cb) {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    },
  });
}

const teamUpload = createUpload('tedx-team-members');
const facultyUpload = createUpload('tedx-faculty-coordinators');

// Logos use stable, fixed public_ids so they are replaced rather than duplicated.
const headerLogoUpload = createUpload('tedx-website/logos', 'header');
const footerLogoUpload = createUpload('tedx-website/logos', 'footer');

module.exports = { teamUpload, facultyUpload, headerLogoUpload, footerLogoUpload };
