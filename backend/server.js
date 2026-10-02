require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const teamRoutes = require('./routes/teamRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const speakerRoutes = require('./routes/speakerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const footerRoutes = require('./routes/footerRoutes');
const { connectToDatabase } = require('./db');
const { seedSpeakersIfEmpty } = require('./controllers/speakerController');

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://tedxbiet.netlify.app',
  ...(process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.netlify.app') ||
        /\.netlify\.app$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  })
);

// Images are now uploaded via multipart/form-data directly to Cloudinary.
// JSON bodies no longer carry base64 image data, so 1 MB is plenty.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/team', teamRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

async function ensureDb() {
  await connectToDatabase();
  await seedSpeakersIfEmpty();
}

async function startServer() {
  await ensureDb();
  app.listen(PORT, () => {
    console.log(`TEDx BIET API running on http://localhost:${PORT}`);
  });
}

// Local/dev: run as a normal server. Netlify Functions import { app } instead.
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to connect to MongoDB:', error.message);
    process.exit(1);
  });
}

module.exports = { app, ensureDb };
