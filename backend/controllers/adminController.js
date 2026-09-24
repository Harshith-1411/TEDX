const { ObjectId } = require('mongodb');
const { getTeamCollection } = require('../db');
const { login, logout } = require('../auth');

function cleanMember(input) {
  return {
    name: String(input.name || '').trim(),
    slug: String(input.slug || '').trim().toLowerCase(),
    image: String(input.image || ''),
    role: String(input.role || '').trim(),
    description: String(input.description || '').trim(),
    team: String(input.team || '').trim(),
    email: String(input.email || '').trim(),
    linkedin: String(input.linkedin || '').trim(),
    instagram: String(input.instagram || '').trim(),
  };
}

function validateMember(member) {
  const required = ['name', 'slug', 'role', 'description', 'team'];
  return required.every((field) => member[field]);
}

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

async function adminLogin(req, res) {
  const token = await login(req.body.username, req.body.password);
  if (!token) return res.status(401).json({ message: 'Invalid admin credentials' });
  res.json({ token });
}

function adminLogout(req, res) {
  const authorization = req.get('authorization') || '';
  logout(authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
  res.status(204).end();
}

async function getAdminMembers(req, res) {
  const members = await (await getTeamCollection()).find({}).sort({ name: 1 }).toArray();
  res.json(members);
}

async function createMember(req, res) {
  const member = cleanMember(req.body);
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

  const member = cleanMember(req.body);
  if (!validateMember(member)) {
    return res.status(400).json({ message: 'Name, slug, role, description, and team are required' });
  }

  const collection = await getTeamCollection();
  const duplicate = await collection.findOne({ slug: member.slug, _id: { $ne: id } });
  if (duplicate) return res.status(409).json({ message: 'Slug already exists' });

  const result = await collection.replaceOne({ _id: id }, member);
  if (!result.matchedCount) return res.status(404).json({ message: 'Team member not found' });
  res.json({ ...member, _id: id });
}

async function deleteMember(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid member id' });

  const result = await (await getTeamCollection()).deleteOne({ _id: id });
  if (!result.deletedCount) return res.status(404).json({ message: 'Team member not found' });
  res.status(204).end();
}

module.exports = {
  adminLogin,
  adminLogout,
  getAdminMembers,
  createMember,
  updateMember,
  deleteMember,
};
