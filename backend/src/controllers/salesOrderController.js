const { z } = require('zod');
const prisma = require('../config/prisma');

const convertQuotationToSalesOrder = async (req, res, next) => {
  try {
    const quotationId = parseInt(req.params.id, 10);
    if (isNaN(quotationId)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        sales_order: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    if (quotation.status !== 'ACCEPTED') {
      return res.status(400).json({
        error: `Cannot convert quotation with status '${quotation.status}'. Only ACCEPTED quotations can be converted into a Sales Order.`,
      });
    }

    if (quotation.sales_order) {
      return res.status(409).json({
        error: 'This quotation has already been converted into a Sales Order.',
      });
    }

    const count = await prisma.salesOrder.count();
    const order_number = `SO-${String(count + 1).padStart(4, '0')}`;

    try {
      const salesOrder = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.salesOrder.create({
          data: {
            order_number,
            customer_id: quotation.customer_id,
            quotation_id: quotation.id,
            total_amount: quotation.grand_total,
            status: 'PENDING',
            created_by: req.user.id,
            items: {
              create: quotation.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
              })),
            },
          },
          include: {
            customer: true,
            quotation: true,
            creator: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
          },
        });

        return newOrder;
      });

      return res.status(201).json({
        message: 'Sales Order created successfully from quotation',
        sales_order: salesOrder,
      });
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict: A Sales Order has already been created for this quotation.',
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

const confirmSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid Sales Order ID.' });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales Order not found.' });
    }

    if (salesOrder.status !== 'PENDING') {
      return res.status(400).json({
        error: `Cannot confirm order with status '${salesOrder.status}'. Order must be PENDING.`,
      });
    }

    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        for (const item of salesOrder.items) {
          const inventory = await tx.inventory.findUnique({
            where: { product_id: item.product_id },
            include: { product: true },
          });

          if (!inventory) {
            throw new Error(`Inventory record missing for product ID ${item.product_id}.`);
          }

          const available = inventory.physical_quantity - inventory.reserved_quantity;
          if (available < item.quantity) {
            const err = new Error(
              `Insufficient stock for '${inventory.product.product_name}'. Requested: ${item.quantity}, Available: ${available}. Reservation aborted.`
            );
            err.statusCode = 400;
            throw err;
          }
        }

        for (const item of salesOrder.items) {
          const updateResult = await tx.$executeRaw`
            UPDATE inventory 
            SET reserved_quantity = reserved_quantity + ${item.quantity}
            WHERE product_id = ${item.product_id} 
              AND (physical_quantity - reserved_quantity) >= ${item.quantity}
          `;

          if (updateResult === 0) {
            const err = new Error(
              `Stock reservation failed concurrently for product ID ${item.product_id}.`
            );
            err.statusCode = 400;
            throw err;
          }
        }

        const confirmed = await tx.salesOrder.update({
          where: { id },
          data: {
            status: 'CONFIRMED',
            confirmed_by: req.user.id,
          },
          include: {
            customer: true,
            creator: { select: { id: true, name: true, email: true } },
            confirmer: { select: { id: true, name: true, email: true } },
            items: { include: { product: { include: { inventory: true } } } },
          },
        });

        return confirmed;
      });

      res.json({
        message: 'Sales Order confirmed and inventory reserved successfully.',
        sales_order: updatedOrder,
      });
    } catch (txError) {
      if (txError.statusCode === 400) {
        return res.status(400).json({ error: txError.message });
      }
      throw txError;
    }
  } catch (error) {
    next(error);
  }
};

const dispatchSchema = z.object({
  vehicle_number: z.string().min(1, 'Vehicle number is required'),
  driver_name: z.string().min(1, 'Driver name is required'),
});

const dispatchSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid Sales Order ID.' });
    }

    const parseResult = dispatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { vehicle_number, driver_name } = parseResult.data;

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales Order not found.' });
    }

    if (salesOrder.status !== 'CONFIRMED') {
      return res.status(400).json({
        error: `Cannot dispatch order with status '${salesOrder.status}'. Order must be CONFIRMED.`,
      });
    }

    const count = await prisma.dispatch.count();
    const dispatch_number = `DISP-${String(count + 1).padStart(4, '0')}`;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: Create Dispatch record
        const dispatch = await tx.dispatch.create({
          data: {
            dispatch_number,
            sales_order_id: salesOrder.id,
            vehicle_number,
            driver_name,
            dispatched_by: req.user.id,
            items: {
              create: salesOrder.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });

        // Step 2: Decrement BOTH physical_quantity AND reserved_quantity for each product
        for (const item of salesOrder.items) {
          const inv = await tx.inventory.findUnique({
            where: { product_id: item.product_id },
          });

          if (!inv || inv.reserved_quantity < item.quantity || inv.physical_quantity < item.quantity) {
            const err = new Error(
              `Cannot dispatch product ID ${item.product_id}: requested quantity exceeds reserved stock.`
            );
            err.statusCode = 400;
            throw err;
          }

          await tx.inventory.update({
            where: { product_id: item.product_id },
            data: {
              physical_quantity: { decrement: item.quantity },
              reserved_quantity: { decrement: item.quantity },
            },
          });
        }

        // Step 3: Update Sales Order status to DISPATCHED
        const updatedOrder = await tx.salesOrder.update({
          where: { id },
          data: { status: 'DISPATCHED' },
          include: {
            customer: true,
            creator: { select: { id: true, name: true, email: true } },
            confirmer: { select: { id: true, name: true, email: true } },
            items: { include: { product: { include: { inventory: true } } } },
          },
        });

        return { dispatch, sales_order: updatedOrder };
      });

      res.json({
        message: 'Sales Order dispatched successfully. Physical & reserved inventory updated.',
        dispatch: result.dispatch,
        sales_order: result.sales_order,
      });
    } catch (txError) {
      if (txError.statusCode === 400) {
        return res.status(400).json({ error: txError.message });
      }
      throw txError;
    }
  } catch (error) {
    next(error);
  }
};

const getSalesOrders = async (req, res, next) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        quotation: true,
        creator: { select: { id: true, name: true, email: true } },
        confirmer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        dispatches: true,
      },
    });

    const formattedOrders = salesOrders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const inv = item.product?.inventory;
        return {
          ...item,
          product: {
            ...item.product,
            inventory: inv ? {
              ...inv,
              available_quantity: inv.physical_quantity - inv.reserved_quantity,
            } : null,
          },
        };
      }),
    }));

    res.json({ sales_orders: formattedOrders });
  } catch (error) {
    next(error);
  }
};

const getSalesOrderById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid Sales Order ID.' });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: {
          include: { items: true },
        },
        creator: { select: { id: true, name: true, email: true } },
        confirmer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        dispatches: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales Order not found.' });
    }

    const formattedOrder = {
      ...salesOrder,
      items: salesOrder.items.map(item => {
        const inv = item.product?.inventory;
        return {
          ...item,
          product: {
            ...item.product,
            inventory: inv ? {
              ...inv,
              available_quantity: inv.physical_quantity - inv.reserved_quantity,
            } : null,
          },
        };
      }),
    };

    res.json({ sales_order: formattedOrder });
  } catch (error) {
    next(error);
  }
};

const cancelSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid Sales Order ID.' });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales Order not found.' });
    }

    if (salesOrder.status === 'DISPATCHED' || salesOrder.status === 'CANCELLED') {
      return res.status(400).json({
        error: `Cannot cancel order with status '${salesOrder.status}'.`,
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (salesOrder.status === 'CONFIRMED') {
        for (const item of salesOrder.items) {
          await tx.inventory.update({
            where: { product_id: item.product_id },
            data: {
              reserved_quantity: { decrement: item.quantity },
            },
          });
        }
      }

      return await tx.salesOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    res.json({
      message: 'Sales Order cancelled successfully.',
      sales_order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  convertQuotationToSalesOrder,
  confirmSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  getSalesOrders,
  getSalesOrderById,
};
