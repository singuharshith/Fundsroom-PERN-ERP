const prisma = require('../config/prisma');

const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { product_code: 'asc' },
      include: {
        inventory: true,
      },
    });

    // Format products with derived available_quantity
    const formattedProducts = products.map(p => ({
      ...p,
      inventory: p.inventory ? {
        ...p.inventory,
        available_quantity: p.inventory.physical_quantity - p.inventory.reserved_quantity,
      } : null,
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    next(error);
  }
};

const getInventory = async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
      orderBy: { product: { product_code: 'asc' } },
    });

    const formattedInventory = inventory.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_code: item.product.product_code,
      product_name: item.product.product_name,
      category: item.product.category,
      unit: item.product.unit,
      base_price: item.product.base_price,
      physical_quantity: item.physical_quantity,
      reserved_quantity: item.reserved_quantity,
      available_quantity: item.physical_quantity - item.reserved_quantity,
    }));

    res.json({ inventory: formattedInventory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getInventory,
};
