const { z } = require('zod');
const prisma = require('../config/prisma');

const enquiryItemSchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

const createEnquirySchema = z.object({
  customer_id: z.number().int().positive('Customer ID is required'),
  required_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)')),
  notes: z.string().optional(),
  items: z.array(enquiryItemSchema).min(1, 'Enquiry must contain at least one line item'),
});

const createEnquiry = async (req, res, next) => {
  try {
    const parseResult = createEnquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { customer_id, required_date, notes, items } = parseResult.data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) {
      return res.status(400).json({ error: 'Selected customer does not exist.' });
    }

    // Verify products exist
    const productIds = items.map(i => i.product_id);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (existingProducts.length !== new Set(productIds).size) {
      return res.status(400).json({ error: 'One or more selected products do not exist.' });
    }

    // Generate unique enquiry number
    const count = await prisma.enquiry.count();
    const enquiry_number = `ENQ-${String(count + 1).padStart(4, '0')}`;

    const newEnquiry = await prisma.enquiry.create({
      data: {
        enquiry_number,
        customer_id,
        required_date: new Date(required_date),
        notes,
        status: 'NEW',
        created_by: req.user.id,
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Enquiry created successfully',
      enquiry: newEnquiry,
    });
  } catch (error) {
    next(error);
  }
};

const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
          },
        },
        quotations: {
          select: { id: true, quotation_number: true, status: true },
        },
      },
    });

    res.json({ enquiries });
  } catch (error) {
    next(error);
  }
};

const getEnquiryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid enquiry ID.' });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
          },
        },
        quotations: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    res.json({ enquiry });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
};
