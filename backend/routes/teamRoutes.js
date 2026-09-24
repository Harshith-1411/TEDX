const express = require('express');
const {
  getAllTeamMembers,
  getTeamMemberBySlug,
} = require('../controllers/teamController');

const router = express.Router();

router.get('/', getAllTeamMembers);
router.get('/:slug', getTeamMemberBySlug);

module.exports = router;
