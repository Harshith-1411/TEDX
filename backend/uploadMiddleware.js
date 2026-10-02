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
      let publicId;
      if (typeof fixedPublicId === 'function') {
        publicId = fixedPublicId(req);
      } else if (fixedPublicId) {
        publicId = fixedPublicId;
      } else {
        publicId = (req.body && req.body.slug) || undefined;
      }

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
const speakerUpload = createUpload('tedx-speakers');

// Logos use stable, theme-aware public_ids so each theme has its own file in Cloudinary.
const headerLogoUpload = createUpload('tedx-website/logos', (req) => {
  const theme = (req.query?.theme || req.body?.theme || '').toLowerCase().trim();
  return theme && theme !== 'red' ? `header_${theme}` : 'header';
});
const footerLogoUpload = createUpload('tedx-website/logos', (req) => {
  const theme = (req.query?.theme || req.body?.theme || '').toLowerCase().trim();
  return theme && theme !== 'red' ? `footer_${theme}` : 'footer';
});

module.exports = { teamUpload, facultyUpload, speakerUpload, headerLogoUpload, footerLogoUpload };
