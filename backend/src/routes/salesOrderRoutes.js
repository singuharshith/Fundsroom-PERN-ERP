const express = require('express');
const {
  convertQuotationToSalesOrder,
  getSalesOrders,
  getSalesOrderById,
} = require('../controllers/salesOrderController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSalesOrders);
router.get('/:id', getSalesOrderById);

module.exports = router;
