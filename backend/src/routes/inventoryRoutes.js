const express = require('express');
const { getInventory, restockInventory } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getInventory);
router.post('/restock', requireRole('ADMIN'), restockInventory);

module.exports = router;
