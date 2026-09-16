const express = require('express');
const { getProducts, getInventory } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProducts);

module.exports = router;
