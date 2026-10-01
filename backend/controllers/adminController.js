const { ObjectId } = require('mongodb');
const { getTeamCollection, getFacultyCollection } = require('../db');
const { login, logout } = require('../auth');
const cloudinary = require('../cloudinary');

function cleanMember(input, imageUrl, imagePublicId) {
  const member = {
    name: String(input.name || '').trim(),
    slug: String(input.slug || '').trim().toLowerCase(),
    image: imageUrl !== undefined ? imageUrl : String(input.image || ''),
    role: String(input.role || '').trim(),
    description: String(input.description || '').trim(),
    team: String(input.team || '').trim(),
    email: String(input.email || '').trim(),
    linkedin: String(input.linkedin || '').trim(),
    instagram: String(input.instagram || '').trim(),
  };
  if (imagePublicId) member.imagePublicId = imagePublicId;
  return member;
}

function cleanFaculty(input, imageUrl, imagePublicId) {
  const member = {
    name: String(input.name || '').trim(),
    slug: String(input.slug || '').trim().toLowerCase(),
    image: imageUrl !== undefined ? imageUrl : String(input.image || ''),
    role: String(input.role || '').trim(),
    description: String(input.description || '').trim(),
    email: String(input.email || '').trim(),
    linkedin: String(input.linkedin || '').trim(),
    instagram: String(input.instagram || '').trim(),
  };
  if (imagePublicId) member.imagePublicId = imagePublicId;
  return member;
}

function validateMember(member) {
  const required = ['name', 'slug', 'role', 'description', 'team'];
  return required.every((field) => member[field]);
}

function validateFaculty(member) {
  const required = ['name', 'slug', 'role', 'description'];
  return required.every((field) => member[field]);
}

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// Delete an old Cloudinary image by public_id (best-effort, non-blocking)
async function tryDeleteCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Could not delete old Cloudinary image:', publicId, err.message);
  }
}

async function adminLogin(req, res) {
  const token = await login(req.body.username, req.body.password);
  if (!token) return res.status(401).json({ message: 'Invalid admin credentials' });
  res.json({ token });
}

async function adminLogout(req, res) {
  const authorization = req.get('authorization') || '';
  await logout(authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
  res.status(204).end();
}

async function getAdminMembers(req, res) {
  const members = await (await getTeamCollection())
    .find({ category: { $ne: 'faculty' } })
    .sort({ name: 1 })
    .toArray();
  res.json(members);
}

async function createMember(req, res) {
  // If a file was uploaded via multer → Cloudinary, use its URL & public_id
  const imageUrl = req.file ? req.file.path : undefined;
  const imagePublicId = req.file ? req.file.filename : undefined;

  const body = req.body;
  const member = cleanMember(body, imageUrl, imagePublicId);
  if (!validateMember(member)) {
    return res.status(400).json({ message: 'Name, slug, role, description, and team are required' });
  }

  const collection = await getTeamCollection();
  const existing = await collection.findOne({ slug: member.slug });
  if (existing) return res.status(409).json({ message: 'Slug already exists' });

  const result = await collection.insertOne(member);
  res.status(201).json({ ...member, _id: result.insertedId });
}

async function updateMember(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid member id' });

  const imageUrl = req.file ? req.file.path : undefined;
  const imagePublicId = req.file ? req.file.filename : undefined;

  const body = req.body;
  const member = cleanMember(body, imageUrl, imagePublicId);
  if (!validateMember(member)) {
    return res.status(400).json({ message: 'Name, slug, role, description, and team are required' });
  }

  const collection = await getTeamCollection();
  const duplicate = await collection.findOne({ slug: member.slug, _id: { $ne: id } });
  if (duplicate) return res.status(409).json({ message: 'Slug already exists' });

  const existing = await collection.findOne({ _id: id });
  if (!existing) return res.status(404).json({ message: 'Team member not found' });

  // Handle Cloudinary assets
  if (req.file) {
    // A new image was uploaded; remove previous asset if it had one
    if (existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    }
  } else if (!member.image) {
    // Photo was explicitly removed; delete from Cloudinary
    if (existing.imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    }
    delete member.imagePublicId;
  } else if (existing.imagePublicId) {
    // Image was preserved; retain existing imagePublicId
    member.imagePublicId = existing.imagePublicId;
  }

  const result = await collection.replaceOne({ _id: id }, member);
  if (!result.matchedCount) return res.status(404).json({ message: 'Team member not found' });
  res.json({ ...member, _id: id });
}

async function deleteMember(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid member id' });

  const collection = await getTeamCollection();

  // Delete associated Cloudinary image if present
  const existing = await collection.findOne({ _id: id }, { projection: { imagePublicId: 1 } });
  if (existing?.imagePublicId) {
    await tryDeleteCloudinaryImage(existing.imagePublicId);
  }

  const result = await collection.deleteOne({ _id: id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Team member not found' });
  res.status(204).end();
}

async function getAdminFaculty(req, res) {
  const faculty = await (await getFacultyCollection()).find({}).sort({ name: 1 }).toArray();
  res.json(faculty);
}

async function createFaculty(req, res) {
  const imageUrl = req.file ? req.file.path : undefined;
  const imagePublicId = req.file ? req.file.filename : undefined;

  const body = req.body;
  const member = cleanFaculty(body, imageUrl, imagePublicId);
  if (!validateFaculty(member)) {
    return res.status(400).json({ message: 'Name, slug, role, and description are required' });
  }

  const collection = await getFacultyCollection();
  const existing = await collection.findOne({ slug: member.slug });
  if (existing) return res.status(409).json({ message: 'Slug already exists' });

  const result = await collection.insertOne(member);
  res.status(201).json({ ...member, _id: result.insertedId });
}

async function updateFaculty(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid faculty id' });

  const imageUrl = req.file ? req.file.path : undefined;
  const imagePublicId = req.file ? req.file.filename : undefined;

  const body = req.body;
  const member = cleanFaculty(body, imageUrl, imagePublicId);
  if (!validateFaculty(member)) {
    return res.status(400).json({ message: 'Name, slug, role, and description are required' });
  }

  const collection = await getFacultyCollection();
  const duplicate = await collection.findOne({ slug: member.slug, _id: { $ne: id } });
  if (duplicate) return res.status(409).json({ message: 'Slug already exists' });

  const existing = await collection.findOne({ _id: id });
  if (!existing) return res.status(404).json({ message: 'Faculty coordinator not found' });

  // Handle Cloudinary assets
  if (req.file) {
    // A new image was uploaded; remove previous asset if it had one
    if (existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    }
  } else if (!member.image) {
    // Photo was explicitly removed; delete from Cloudinary
    if (existing.imagePublicId) {
      await tryDeleteCloudinaryImage(existing.imagePublicId);
    }
    delete member.imagePublicId;
  } else if (existing.imagePublicId) {
    // Image was preserved; retain existing imagePublicId
    member.imagePublicId = existing.imagePublicId;
  }

  const result = await collection.replaceOne({ _id: id }, member);
  if (!result.matchedCount) return res.status(404).json({ message: 'Faculty coordinator not found' });
  res.json({ ...member, _id: id });
}

async function deleteFaculty(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid faculty id' });

  const collection = await getFacultyCollection();

  // Delete associated Cloudinary image if present
  const existing = await collection.findOne({ _id: id }, { projection: { imagePublicId: 1 } });
  if (existing?.imagePublicId) {
    await tryDeleteCloudinaryImage(existing.imagePublicId);
  }

  const result = await collection.deleteOne({ _id: id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Faculty coordinator not found' });
  res.status(204).end();
}

module.exports = {
  adminLogin,
  adminLogout,
  getAdminMembers,
  createMember,
  updateMember,
  deleteMember,
  getAdminFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};
