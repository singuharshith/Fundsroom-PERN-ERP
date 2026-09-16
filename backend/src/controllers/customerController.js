const { z } = require('zod');
const prisma = require('../config/prisma');

const createCustomerSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().min(1, 'Contact person is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(1, 'City is required'),
});

const getCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { company_name: 'asc' },
    });
    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const parseResult = createCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const newCustomer = await prisma.customer.create({
      data: parseResult.data,
    });

    res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  createCustomer,
};
