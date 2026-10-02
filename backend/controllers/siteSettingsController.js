const { getSiteSettingsCollection } = require('../db');

const SETTINGS_ID = 'branding';

// Default event date: 5 October 2026 09:00:00 IST
const DEFAULT_EVENT_DATE = '2026-10-05T09:00:00+05:30';
const DEFAULT_EVENT_LABEL = '5 October 2026';
const DEFAULT_TIME_LABEL = '09:00 AM IST';

async function getSiteSettings(req, res) {
  try {
    const settings = await (await getSiteSettingsCollection()).findOne(
      { _id: SETTINGS_ID },
      { projection: { _id: 0 } }
    );

    const result = {
      eventDate: DEFAULT_EVENT_DATE,
      eventDateLabel: DEFAULT_EVENT_LABEL,
      eventTimeLabel: DEFAULT_TIME_LABEL,
      themeLogos: {},
      ...(settings || {}),
    };

    res.json(result);
  } catch (error) {
    console.error('Unable to load site settings:', error);
    res.status(500).json({ message: 'Unable to load site settings' });
  }
}

/**
 * Upload a new header or footer logo.
 * Supports theme-specific logos via `theme` query or body parameter:
 * e.g. PUT /api/admin/logos/header?theme=matrix
 * If theme is specified, saves to `themeLogos.<theme>` so each theme retains its own logo!
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

    const theme = (req.query.theme || req.body.theme || '').toLowerCase().trim();
    const logoUrl = req.file.path; // Cloudinary secure_url
    const logoPublicId = req.file.filename; // Cloudinary public_id

    const collection = await getSiteSettingsCollection();
    const updateFields = {};

    if (theme && theme !== 'red') {
      // Save logo specifically for this theme ONLY - never touch global headerLogo!
      updateFields[`themeLogos.${theme}`] = logoUrl;
      updateFields[`themeLogosPublicId.${theme}`] = logoPublicId;
    } else if (theme === 'red') {
      updateFields['themeLogos.red'] = logoUrl;
      updateFields['themeLogosPublicId.red'] = logoPublicId;
      updateFields[type === 'header' ? 'headerLogo' : 'footerLogo'] = logoUrl;
      updateFields[type === 'header' ? 'headerLogoPublicId' : 'footerLogoPublicId'] = logoPublicId;
    } else {
      const field = type === 'header' ? 'headerLogo' : 'footerLogo';
      const publicIdField = type === 'header' ? 'headerLogoPublicId' : 'footerLogoPublicId';
      updateFields[field] = logoUrl;
      updateFields[publicIdField] = logoPublicId;
    }

    await collection.updateOne(
      { _id: SETTINGS_ID },
      { $set: updateFields },
      { upsert: true }
    );

    const updated = await collection.findOne(
      { _id: SETTINGS_ID },
      { projection: { _id: 0 } }
    );

    res.json({
      eventDate: DEFAULT_EVENT_DATE,
      eventDateLabel: DEFAULT_EVENT_LABEL,
      eventTimeLabel: DEFAULT_TIME_LABEL,
      themeLogos: {},
      ...(updated || {}),
    });
  } catch (error) {
    console.error('Unable to update logo:', error);
    res.status(500).json({ message: 'Unable to update logo' });
  }
}

/**
 * Update event date and time in MongoDB
 * PUT /api/admin/event-time
 */
async function updateEventTime(req, res) {
  try {
    const { eventDate, eventDateLabel, eventTimeLabel } = req.body;
    if (!eventDate) {
      return res.status(400).json({ message: 'eventDate is required' });
    }

    const collection = await getSiteSettingsCollection();
    await collection.updateOne(
      { _id: SETTINGS_ID },
      {
        $set: {
          eventDate,
          eventDateLabel: eventDateLabel || DEFAULT_EVENT_LABEL,
          eventTimeLabel: eventTimeLabel || DEFAULT_TIME_LABEL,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const updated = await collection.findOne(
      { _id: SETTINGS_ID },
      { projection: { _id: 0 } }
    );

    res.json(updated);
  } catch (error) {
    console.error('Unable to update event time:', error);
    res.status(500).json({ message: 'Unable to update event time' });
  }
}

module.exports = { getSiteSettings, updateLogo, updateEventTime };