const { getSiteSettingsCollection } = require('../db');

async function getSiteSettings(req, res) {
  try {
    const settings = await (await getSiteSettingsCollection()).findOne(
      { _id: 'branding' },
      { projection: { _id: 0 } }
    );

    res.json(settings || {});
  } catch (error) {
    console.error('Unable to load site settings:', error);
    res.status(500).json({ message: 'Unable to load site settings' });
  }
}

module.exports = { getSiteSettings };