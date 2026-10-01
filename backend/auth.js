const crypto = require('crypto');
const { getAdminCollection, getSessionsCollection } = require('./db');

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
  // Persist sessions so admin auth works across Netlify Function instances
  await (await getSessionsCollection()).insertOne({
    token,
    createdAt: new Date(),
  });
  return token;
}

async function requireAdmin(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const session = await (await getSessionsCollection()).findOne({ token });
    if (!session) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

async function logout(token) {
  if (!token) return;
  await (await getSessionsCollection()).deleteOne({ token });
}

module.exports = { hashPassword, login, logout, requireAdmin };
