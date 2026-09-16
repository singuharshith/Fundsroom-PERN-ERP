const express = require('express');
const { createEnquiry, getEnquiries, getEnquiryById } = require('../controllers/enquiryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createEnquiry);
router.get('/', getEnquiries);
router.get('/:id', getEnquiryById);

module.exports = router;
