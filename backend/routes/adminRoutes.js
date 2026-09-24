const express = require('express');
const { requireAdmin } = require('../auth');
const {
  adminLogin,
  adminLogout,
  getAdminMembers,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/adminController');

const router = express.Router();

router.post('/login', adminLogin);
router.use(requireAdmin);
router.post('/logout', adminLogout);
router.get('/team', getAdminMembers);
router.post('/team', createMember);
router.put('/team/:id', updateMember);
router.delete('/team/:id', deleteMember);

module.exports = router;
