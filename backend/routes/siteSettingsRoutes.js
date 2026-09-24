const express = require('express');
const { getSiteSettings } = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/', getSiteSettings);

module.exports = router;