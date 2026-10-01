const express = require('express');
const { requireAdmin } = require('../auth');
const {
  adminLogin,
  adminLogout,
  getAdminMembers,
  createMember,
  updateMember,
  deleteMember,
  getAdminFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/adminController');
const { updateFooter } = require('../controllers/footerController');
const { updateLogo } = require('../controllers/siteSettingsController');
const {
  teamUpload,
  facultyUpload,
  headerLogoUpload,
  footerLogoUpload,
} = require('../uploadMiddleware');

const router = express.Router();

router.post('/login', adminLogin);
router.use(requireAdmin);
router.post('/logout', adminLogout);

// Team members
router.get('/team', getAdminMembers);
router.post('/team', teamUpload.single('image'), createMember);
router.put('/team/:id', teamUpload.single('image'), updateMember);
router.delete('/team/:id', deleteMember);

// Faculty coordinators
router.get('/faculty', getAdminFaculty);
router.post('/faculty', facultyUpload.single('image'), createFaculty);
router.put('/faculty/:id', facultyUpload.single('image'), updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Footer social links
router.put('/footer', updateFooter);

// Logo management — header and footer logos
// PUT /api/admin/logos/header  — upload new header logo
// PUT /api/admin/logos/footer  — upload new footer logo
router.put('/logos/header', headerLogoUpload.single('logo'), (req, res, next) => {
  req.params.type = 'header';
  next();
}, updateLogo);

router.put('/logos/footer', footerLogoUpload.single('logo'), (req, res, next) => {
  req.params.type = 'footer';
  next();
}, updateLogo);

module.exports = router;
