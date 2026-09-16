const { z } = require('zod');
const prisma = require('../config/prisma');

const quotationItemSchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  discount_percent: z.number().min(0).max(100).default(0),
  gst_percent: z.number().min(0).max(100).default(18),
});

const createQuotationSchema = z.object({
  enquiry_id: z.number().int().positive('Enquiry ID is required'),
  valid_until: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)')),
  items: z.array(quotationItemSchema).min(1, 'Quotation must contain at least one line item'),
});

const createQuotation = async (req, res, next) => {
  try {
    const parseResult = createQuotationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { enquiry_id, valid_until, items } = parseResult.data;

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiry_id },
      include: { customer: true },
    });

    if (!enquiry) {
      return res.status(400).json({ error: 'Referenced Enquiry does not exist.' });
    }

    // Server-side total calculation: never trust client totals!
    let computedGrandTotal = 0;
    const processedItems = items.map(item => {
      const qty = item.quantity;
      const price = item.unit_price;
      const discount = item.discount_percent ?? 0;
      const gst = item.gst_percent ?? 18;

      // line_amount = (quantity * unit_price) * (1 - discount_percent/100) * (1 + gst_percent/100)
      const subtotal = qty * price;
      const afterDiscount = subtotal * (1 - discount / 100);
      const withGst = afterDiscount * (1 + gst / 100);
      const line_amount = Math.round(withGst * 100) / 100;

      computedGrandTotal += line_amount;

      return {
        product_id: item.product_id,
        quantity: qty,
        unit_price: price,
        discount_percent: discount,
        gst_percent: gst,
        line_amount,
      };
    });

    computedGrandTotal = Math.round(computedGrandTotal * 100) / 100;

    const count = await prisma.quotation.count();
    const quotation_number = `QUO-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          quotation_number,
          enquiry_id,
          customer_id: enquiry.customer_id,
          valid_until: new Date(valid_until),
          status: 'DRAFT',
          grand_total: computedGrandTotal,
          created_by: req.user.id,
          items: {
            create: processedItems,
          },
        },
        include: {
          customer: true,
          enquiry: true,
          items: { include: { product: true } },
        },
      });

      // Update Enquiry status to QUOTED
      await tx.enquiry.update({
        where: { id: enquiry_id },
        data: { status: 'QUOTED' },
      });

      return newQuotation;
    });

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

const getQuotations = async (req, res, next) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        enquiry: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        sales_order: { select: { id: true, order_number: true, status: true } },
      },
    });

    res.json({ quotations });
  } catch (error) {
    next(error);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        enquiry: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        sales_order: { select: { id: true, order_number: true, status: true } },
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    res.json({ quotation });
  } catch (error) {
    next(error);
  }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }

    const statusSchema = z.object({
      status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'], {
        errorMap: () => ({ message: 'Status must be DRAFT, SENT, ACCEPTED, or REJECTED' }),
      }),
    });

    const parseResult = statusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { status } = parseResult.data;

    const existingQuotation = await prisma.quotation.findUnique({ where: { id } });
    if (!existingQuotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    const updatedQuotation = await prisma.$transaction(async (tx) => {
      const updated = await tx.quotation.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Synchronize Enquiry status
      if (status === 'ACCEPTED') {
        await tx.enquiry.update({
          where: { id: existingQuotation.enquiry_id },
          data: { status: 'WON' },
        });
      } else if (status === 'REJECTED') {
        await tx.enquiry.update({
          where: { id: existingQuotation.enquiry_id },
          data: { status: 'LOST' },
        });
      }

      return updated;
    });

    res.json({
      message: `Quotation status updated to ${status}`,
      quotation: updatedQuotation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
};
