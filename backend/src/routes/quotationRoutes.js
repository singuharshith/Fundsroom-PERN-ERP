const express = require('express');
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
} = require('../controllers/quotationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createQuotation);
router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.patch('/:id/status', updateQuotationStatus);

module.exports = router;
