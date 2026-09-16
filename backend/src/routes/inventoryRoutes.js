const express = require('express');
const { getInventory } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getInventory);

module.exports = router;
