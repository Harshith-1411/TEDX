require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const teamRoutes = require('./routes/teamRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const { connectToDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);

app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/team', teamRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`TEDx BIET API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to connect to MongoDB:', error.message);
  process.exit(1);
});
