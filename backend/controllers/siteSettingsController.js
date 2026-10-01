const { getSiteSettingsCollection } = require('../db');
const cloudinary = require('../cloudinary');

const SETTINGS_ID = 'branding';

async function getSiteSettings(req, res) {
  try {
    const settings = await (await getSiteSettingsCollection()).findOne(
      { _id: SETTINGS_ID },
      { projection: { _id: 0 } }
    );

    res.json(settings || {});
  } catch (error) {
    console.error('Unable to load site settings:', error);
    res.status(500).json({ message: 'Unable to load site settings' });
  }
}

/**
 * Upload a new header or footer logo.
 * The logo type ('header' or 'footer') is determined by req.params.type.
 * The file is already uploaded to Cloudinary by the multer middleware;
 * req.file.path is the secure_url and req.file.filename is the public_id.
 */
async function updateLogo(req, res) {
  try {
    const { type } = req.params; // 'header' or 'footer'
    if (type !== 'header' && type !== 'footer') {
      return res.status(400).json({ message: 'Logo type must be header or footer' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const logoUrl = req.file.path;        // Cloudinary secure_url
    const logoPublicId = req.file.filename; // Cloudinary public_id

    const field = type === 'header' ? 'headerLogo' : 'footerLogo';
    const publicIdField = type === 'header' ? 'headerLogoPublicId' : 'footerLogoPublicId';

    const collection = await getSiteSettingsCollection();

    // Fetch existing public_id for cleanup (same stable ID will be overwritten
    // by Cloudinary, but keep the record consistent)
    const existing = await collection.findOne(
      { _id: SETTINGS_ID },
      { projection: { [publicIdField]: 1 } }
    );

    // Update the settings document (upsert in case it doesn't exist yet)
    await collection.updateOne(
      { _id: SETTINGS_ID },
      {
        $set: {
          [field]: logoUrl,
          [publicIdField]: logoPublicId,
        },
      },
      { upsert: true }
    );

    // Return the updated settings (without _id)
    const updated = await collection.findOne(
      { _id: SETTINGS_ID },
      { projection: { _id: 0 } }
    );

    res.json(updated);
  } catch (error) {
    console.error('Unable to update logo:', error);
    res.status(500).json({ message: 'Unable to update logo' });
  }
}

module.exports = { getSiteSettings, updateLogo };