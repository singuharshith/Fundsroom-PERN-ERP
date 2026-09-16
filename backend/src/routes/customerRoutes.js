const express = require('express');
const { getCustomers, createCustomer } = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);

module.exports = router;
