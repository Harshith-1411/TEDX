const express = require('express');
const { getFooter } = require('../controllers/footerController');

const router = express.Router();

router.get('/', getFooter);

module.exports = router;
