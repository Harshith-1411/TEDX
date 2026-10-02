const express = require('express');
const { getSpeakers } = require('../controllers/speakerController');

const router = express.Router();

router.get('/', getSpeakers);

module.exports = router;
