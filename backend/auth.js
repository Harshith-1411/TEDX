const crypto = require('crypto');
const { getAdminCollection } = require('./db');

const sessions = new Map();

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

async function login(username, password) {
  const admin = await (await getAdminCollection()).findOne({ username });
  if (!admin) {
    return null;
  }

  const passwordHash = await hashPassword(password, admin.salt);
  if (passwordHash !== admin.passwordHash) return null;

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  next();
}

function logout(token) {
  sessions.delete(token);
}

module.exports = { hashPassword, login, logout, requireAdmin };
