const prisma = require('../config/prisma');

const convertQuotationToSalesOrder = async (req, res, next) => {
  try {
    const quotationId = parseInt(req.params.id, 10);
    if (isNaN(quotationId)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }

    // Fetch quotation with items
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

    // Guard 1: Status must be ACCEPTED
    if (quotation.status !== 'ACCEPTED') {
      return res.status(400).json({
        error: `Cannot convert quotation with status '${quotation.status}'. Only ACCEPTED quotations can be converted into a Sales Order.`,
      });
    }

    // Guard 2: Application level check for existing sales order
    if (quotation.sales_order) {
      return res.status(409).json({
        error: 'This quotation has already been converted into a Sales Order.',
      });
    }

    // Generate unique Sales Order Number
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
      // Prisma P2002 code indicates unique constraint violation (quotation_id)
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

    // Attach computed available_quantity to each item's product inventory
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

module.exports = {
  convertQuotationToSalesOrder,
  getSalesOrders,
  getSalesOrderById,
};
