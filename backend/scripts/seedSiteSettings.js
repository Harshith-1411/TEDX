const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { connectToDatabase, getSiteSettingsCollection } = require('../db');

function toDataUrl(fileName) {
  const filePath = path.join(__dirname, '..', '..', fileName);
  const image = fs.readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${image}`;
}

async function seedSiteSettings() {
  await connectToDatabase();
  const collection = await getSiteSettingsCollection();

  await collection.replaceOne(
    { _id: 'branding' },
    {
      _id: 'branding',
      headerLogo: toDataUrl('Header_logo.png'),
      footerLogo: toDataUrl('Footer_logo.png'),
    },
    { upsert: true }
  );

  console.log('Site logos stored in MongoDB.');
  process.exit(0);
}

seedSiteSettings().catch((error) => {
  console.error('Unable to seed site settings:', error.message);
  process.exit(1);
});