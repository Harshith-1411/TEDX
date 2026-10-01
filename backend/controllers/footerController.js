const { getFooterCollection } = require('../db');

const FOOTER_ID = 'social';

function cleanFooter(input = {}) {
  return {
    instagram: String(input.instagram || '').trim(),
    linkedin: String(input.linkedin || '').trim(),
    youtube: String(input.youtube || '').trim(),
  };
}

async function getFooter(req, res) {
  try {
    const collection = await getFooterCollection();
    let doc = await collection.findOne({ _id: FOOTER_ID });

    // Ensure the Footer collection/document exists in MongoDB.
    if (!doc) {
      const empty = cleanFooter();
      await collection.updateOne(
        { _id: FOOTER_ID },
        { $setOnInsert: empty },
        { upsert: true }
      );
      doc = { _id: FOOTER_ID, ...empty };
    }

    res.json({
      instagram: doc.instagram || '',
      linkedin: doc.linkedin || '',
      youtube: doc.youtube || '',
    });
  } catch (error) {
    console.error('Unable to load footer data:', error);
    res.status(500).json({ message: 'Unable to load footer data' });
  }
}

async function updateFooter(req, res) {
  try {
    const footer = cleanFooter(req.body);
    const collection = await getFooterCollection();
    await collection.updateOne(
      { _id: FOOTER_ID },
      { $set: footer },
      { upsert: true }
    );
    res.json(footer);
  } catch (error) {
    console.error('Unable to update footer data:', error);
    res.status(500).json({ message: 'Unable to update footer data' });
  }
}

module.exports = {
  getFooter,
  updateFooter,
};
