const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up test products and their referenced child items
  const testProds = await prisma.product.findMany({
    where: {
      OR: [
        { product_code: { startsWith: 'CONCUR-' } },
        { product_code: { startsWith: 'TEST-LOW-' } },
      ],
    },
    select: { id: true },
  });
  const testIds = testProds.map((p) => p.id);

  if (testIds.length > 0) {
    await prisma.dispatchItem.deleteMany({ where: { product_id: { in: testIds } } });
    await prisma.salesOrderItem.deleteMany({ where: { product_id: { in: testIds } } });
    await prisma.quotationItem.deleteMany({ where: { product_id: { in: testIds } } });
    await prisma.enquiryItem.deleteMany({ where: { product_id: { in: testIds } } });
    await prisma.inventory.deleteMany({ where: { product_id: { in: testIds } } });
    await prisma.product.deleteMany({ where: { id: { in: testIds } } });
  }

  // 1. Seed Users
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const salesPasswordHash = await bcrypt.hash('Sales@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fundsroom.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@fundsroom.com',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@fundsroom.com' },
    update: {},
    create: {
      name: 'Sales Representative',
      email: 'sales@fundsroom.com',
      password_hash: salesPasswordHash,
      role: 'SALES_USER',
    },
  });

  console.log('Users seeded:', { admin: admin.email, salesUser: salesUser.email });

  // 2. Seed Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      company_name: 'Acme Industrial Solutions Ltd',
      contact_person: 'Rajesh Kumar',
      mobile: '+91 9876543210',
      email: 'rajesh@acmeind.com',
      city: 'Mumbai',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      company_name: 'Apex Manufacturing Corp',
      contact_person: 'Priya Sharma',
      mobile: '+91 9812345678',
      email: 'priya@apexmfg.com',
      city: 'Pune',
    },
  });

  console.log('Customers seeded:', [customer1.company_name, customer2.company_name]);

  // 3. Seed 10 Clean Industrial Products and Inventory
  const productsData = [
    {
      product_code: 'PROD-001',
      product_name: 'Deep Groove Ball Bearing 6205',
      category: 'Bearings',
      unit: 'Pcs',
      base_price: 350.00,
      initial_stock: 500,
    },
    {
      product_code: 'PROD-002',
      product_name: 'Hydraulic Hose 1/2" 2-Wire (100m)',
      category: 'Hoses',
      unit: 'Roll',
      base_price: 12500.00,
      initial_stock: 200,
    },
    {
      product_code: 'PROD-003',
      product_name: 'Stainless Steel Ball Valve 2"',
      category: 'Valves',
      unit: 'Pcs',
      base_price: 1850.00,
      initial_stock: 150,
    },
    {
      product_code: 'PROD-004',
      product_name: '3-Phase Electric Motor 5.5kW',
      category: 'Motors',
      unit: 'Pcs',
      base_price: 24000.00,
      initial_stock: 80,
    },
    {
      product_code: 'PROD-005',
      product_name: 'High Tensile Fastener M16x50 (Pack of 100)',
      category: 'Fasteners',
      unit: 'Box',
      base_price: 950.00,
      initial_stock: 1000,
    },
    {
      product_code: 'PROD-006',
      product_name: 'Digital Pressure Gauge 0-10 Bar',
      category: 'Gauges',
      unit: 'Pcs',
      base_price: 3200.00,
      initial_stock: 120,
    },
    {
      product_code: 'PROD-007',
      product_name: 'Industrial Centrifugal Water Pump 3HP',
      category: 'Pumps',
      unit: 'Pcs',
      base_price: 18500.00,
      initial_stock: 45,
    },
    {
      product_code: 'PROD-008',
      product_name: 'Heavy-Duty Flanged Gate Valve 4"',
      category: 'Valves',
      unit: 'Pcs',
      base_price: 6800.00,
      initial_stock: 60,
    },
    {
      product_code: 'PROD-009',
      product_name: 'Flexible Rubber Coupling 80mm',
      category: 'Couplings',
      unit: 'Pcs',
      base_price: 1450.00,
      initial_stock: 300,
    },
    {
      product_code: 'PROD-010',
      product_name: 'Pneumatic Air Filter-Regulator Unit',
      category: 'Pneumatics',
      unit: 'Pcs',
      base_price: 2750.00,
      initial_stock: 180,
    },
  ];

  for (const prod of productsData) {
    const product = await prisma.product.upsert({
      where: { product_code: prod.product_code },
      update: {
        product_name: prod.product_name,
        category: prod.category,
        unit: prod.unit,
        base_price: prod.base_price,
      },
      create: {
        product_code: prod.product_code,
        product_name: prod.product_name,
        category: prod.category,
        unit: prod.unit,
        base_price: prod.base_price,
      },
    });

    await prisma.inventory.upsert({
      where: { product_id: product.id },
      update: {},
      create: {
        product_id: product.id,
        physical_quantity: prod.initial_stock,
        reserved_quantity: 0,
      },
    });
  }

  console.log('Successfully seeded 10 industrial products and inventory records.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

