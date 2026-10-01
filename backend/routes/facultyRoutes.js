const express = require('express');
const {
  getAllFaculty,
  getFacultyBySlug,
} = require('../controllers/facultyController');

const router = express.Router();

router.get('/', getAllFaculty);
router.get('/:slug', getFacultyBySlug);

module.exports = router;
