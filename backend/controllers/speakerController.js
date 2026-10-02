const { ObjectId } = require('mongodb');
const { getSpeakersCollection } = require('../db');
const cloudinary = require('../cloudinary');

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function cleanSpeaker(input, imageUrl, imagePublicId) {
  const speaker = {
    name: String(input.name || '').trim(),
    slug: String(input.slug || '').trim().toLowerCase() || String(input.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    role: String(input.role || 'Guest Speaker').trim(),
    note: String(input.note || '').trim(),
    topic: String(input.topic || '').trim(),
    order: Number.parseInt(input.order, 10) || 1,
    image: imageUrl !== undefined ? imageUrl : String(input.image || ''),
  };
  if (imagePublicId) speaker.imagePublicId = imagePublicId;
  return speaker;
}

async function tryDeleteCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Could not delete old Cloudinary speaker image:', publicId, err.message);
  }
}

async function getSpeakers(req, res) {
  try {
    const collection = await getSpeakersCollection();
    const speakers = await collection.find({}).sort({ order: 1, _id: 1 }).toArray();
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch speakers', error: error.message });
  }
}

async function getAdminSpeakers(req, res) {
  try {
    const collection = await getSpeakersCollection();
    const speakers = await collection.find({}).sort({ order: 1, _id: 1 }).toArray();
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch speakers', error: error.message });
  }
}

async function createSpeaker(req, res) {
  try {
    const imageUrl = req.file ? req.file.path : undefined;
    const imagePublicId = req.file ? req.file.filename : undefined;
    const speaker = cleanSpeaker(req.body, imageUrl, imagePublicId);

    if (!speaker.name) {
      return res.status(400).json({ message: 'Speaker name is required' });
    }

    const collection = await getSpeakersCollection();
    const result = await collection.insertOne(speaker);
    res.status(201).json({ ...speaker, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create speaker', error: error.message });
  }
}

async function updateSpeaker(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid speaker id' });

    const imageUrl = req.file ? req.file.path : undefined;
    const imagePublicId = req.file ? req.file.filename : undefined;

    const collection = await getSpeakersCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) return res.status(404).json({ message: 'Speaker not found' });

    const speaker = cleanSpeaker(req.body, imageUrl, imagePublicId);
    if (!speaker.name) {
      return res.status(400).json({ message: 'Speaker name is required' });
    }

    if (imagePublicId && existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    } else if (req.body.image === '' && existing.imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
      speaker.imagePublicId = '';
    }

    await collection.updateOne({ _id: id }, { $set: speaker });
    res.json({ ...speaker, _id: id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update speaker', error: error.message });
  }
}

async function deleteSpeaker(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid speaker id' });

    const collection = await getSpeakersCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) return res.status(404).json({ message: 'Speaker not found' });

    if (existing.imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    }

    await collection.deleteOne({ _id: id });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete speaker', error: error.message });
  }
}

async function seedSpeakersIfEmpty() {
  try {
    const collection = await getSpeakersCollection();
    const count = await collection.countDocuments();
    if (count === 0) {
      const initialSpeakers = [
        {
          name: 'Ajay Kumar',
          slug: 'ajay-kumar',
          role: 'Inauguration Guest',
          note: 'Soulfulvolgs',
          topic: 'Creative Storytelling & Digital Journey',
          image: '',
          order: 1,
        },
        {
          name: 'Hari Pavan',
          slug: 'hari-pavan',
          role: 'Inauguration Guest',
          note: 'HR',
          topic: 'Human Potential & Organizational Leadership',
          image: '',
          order: 2,
        },
      ];
      await collection.insertMany(initialSpeakers);
      console.log('Seeded initial speakers into MongoDB Speakers collection');
    }
  } catch (error) {
    console.warn('Failed to check/seed speakers collection:', error.message);
  }
}

module.exports = {
  getSpeakers,
  getAdminSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  seedSpeakersIfEmpty,
};
