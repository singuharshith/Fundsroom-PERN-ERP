const request = require('supertest');
const app = require('../../app');
const prisma = require('../config/prisma');

describe('PERN ERP Automated Test Suite', () => {
  let adminToken;
  let salesToken;
  let testCustomer;
  let testProduct1;
  let testProduct2;

  beforeAll(async () => {
    // 1. Authenticate test users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@fundsroom.com', password: 'Admin@123' });
    adminToken = adminLogin.body.token;

    const salesLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@fundsroom.com', password: 'Sales@123' });
    salesToken = salesLogin.body.token;

    // Fetch existing test customer and products from seeded DB
    testCustomer = await prisma.customer.findFirst();
    const products = await prisma.product.findMany({ take: 2 });
    testProduct1 = products[0]; // PROD-001
    testProduct2 = products[1]; // PROD-002
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * TEST 1: Server-Side Quotation Total Calculation Accuracy
   */
  test('1. Quotation total is calculated correctly on server-side', async () => {
    // Create an enquiry first
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-12-31',
        items: [{ product_id: testProduct1.id, quantity: 5 }],
      });

    const enquiryId = enqRes.body.enquiry.id;

    // Create quotation: 5 units @ 100 unit price, 10% discount, 18% GST
    // Math: Subtotal = 500. After 10% discount = 450. With 18% GST = 450 * 1.18 = 531.00
    const quoRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enquiryId,
        valid_until: '2026-12-31',
        items: [
          {
            product_id: testProduct1.id,
            quantity: 5,
            unit_price: 100.00,
            discount_percent: 10,
            gst_percent: 18,
          },
        ],
      });

    expect(quoRes.status).toBe(201);
    expect(quoRes.body.quotation).toBeDefined();
    expect(parseFloat(quoRes.body.quotation.grand_total)).toBe(531.00);
    expect(parseFloat(quoRes.body.quotation.items[0].line_amount)).toBe(531.00);
  });

  /**
   * TEST 2: DRAFT or REJECTED Quotation Cannot Be Converted into Sales Order
   */
  test('2. Cannot convert a DRAFT or REJECTED quotation into a Sales Order', async () => {
    // Create enquiry
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-12-31',
        items: [{ product_id: testProduct1.id, quantity: 2 }],
      });

    // Create quotation (starts at DRAFT)
    const quoRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.enquiry.id,
        valid_until: '2026-12-31',
        items: [
          { product_id: testProduct1.id, quantity: 2, unit_price: 200, discount_percent: 0, gst_percent: 18 },
        ],
      });

    const quotationId = quoRes.body.quotation.id;

    // Attempt to convert DRAFT quotation -> should be rejected with 400
    const convertDraftRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convertDraftRes.status).toBe(400);
    expect(convertDraftRes.body.error).toMatch(/Only ACCEPTED quotations can be converted/i);

    // Update status to REJECTED
    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'REJECTED' });

    // Attempt to convert REJECTED quotation -> should be rejected with 400
    const convertRejectedRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convertRejectedRes.status).toBe(400);
    expect(convertRejectedRes.body.error).toMatch(/Only ACCEPTED quotations can be converted/i);
  });

  /**
   * TEST 3: Duplicate Conversion Rejection (One Quotation -> One Sales Order)
   */
  test('3. The same quotation cannot generate two Sales Orders (Double Conversion Guard)', async () => {
    // Create enquiry & quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-12-31',
        items: [{ product_id: testProduct1.id, quantity: 1 }],
      });

    const quoRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.enquiry.id,
        valid_until: '2026-12-31',
        items: [
          { product_id: testProduct1.id, quantity: 1, unit_price: 150, discount_percent: 0, gst_percent: 18 },
        ],
      });

    const quotationId = quoRes.body.quotation.id;

    // Mark ACCEPTED
    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // First convert call -> 201 Created
    const convert1 = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convert1.status).toBe(201);
    expect(convert1.body.sales_order).toBeDefined();

    // Second convert call -> 409 Conflict
    const convert2 = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(convert2.status).toBe(409);
    expect(convert2.body.error).toMatch(/already been converted/i);
  });

  /**
   * TEST 4: Cannot Reserve More Than Available Inventory
   */
  test('4. Cannot reserve more than available inventory (Rejection & Stock Unchanged)', async () => {
    // Create a new product with low physical stock = 5
    const lowStockProduct = await prisma.product.create({
      data: {
        product_code: `TEST-LOW-${Date.now()}`,
        product_name: 'Limited Stock Valve',
        category: 'Test',
        unit: 'Pcs',
        base_price: 500,
        inventory: {
          create: {
            physical_quantity: 5,
            reserved_quantity: 0,
          },
        },
      },
    });

    // Create enquiry requesting 20 units (exceeds stock of 5)
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-12-31',
        items: [{ product_id: lowStockProduct.id, quantity: 20 }],
      });

    const quoRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.enquiry.id,
        valid_until: '2026-12-31',
        items: [
          { product_id: lowStockProduct.id, quantity: 20, unit_price: 500, discount_percent: 0, gst_percent: 18 },
        ],
      });

    await request(app)
      .patch(`/api/quotations/${quoRes.body.quotation.id}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    const orderRes = await request(app)
      .post(`/api/quotations/${quoRes.body.quotation.id}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    const orderId = orderRes.body.sales_order.id;

    // Attempt to confirm reservation as ADMIN
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.error).toMatch(/Insufficient stock/i);

    // Verify reserved_quantity remains 0
    const invAfter = await prisma.inventory.findUnique({
      where: { product_id: lowStockProduct.id },
    });
    expect(invAfter.reserved_quantity).toBe(0);
  });

  /**
   * TEST 5: Role Authorization Restriction (SALES_USER cannot confirm reservation)
   */
  test('5. Unauthorized user (SALES_USER) cannot confirm inventory reservation', async () => {
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-12-31',
        items: [{ product_id: testProduct1.id, quantity: 1 }],
      });

    const quoRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.enquiry.id,
        valid_until: '2026-12-31',
        items: [{ product_id: testProduct1.id, quantity: 1, unit_price: 100, discount_percent: 0, gst_percent: 18 }],
      });

    await request(app)
      .patch(`/api/quotations/${quoRes.body.quotation.id}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    const orderRes = await request(app)
      .post(`/api/quotations/${quoRes.body.quotation.id}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    const orderId = orderRes.body.sales_order.id;

    // Sales user hitting confirm endpoint -> 403 Forbidden
    const unauthConfirm = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(unauthConfirm.status).toBe(403);
    expect(unauthConfirm.body.error).toMatch(/not authorized/i);
  });

  /**
   * BONUS TEST 6: Simultaneous Concurrent Reservation Simulation
   */
  test('6. [BONUS] Concurrent reservation requests on limited stock allow only one to succeed', async () => {
    // Create product with physical stock = 10
    const concurrencyProd = await prisma.product.create({
      data: {
        product_code: `CONCUR-${Date.now()}`,
        product_name: 'Concurrent High-Demand Bearing',
        category: 'Test',
        unit: 'Pcs',
        base_price: 1000,
        inventory: {
          create: {
            physical_quantity: 10,
            reserved_quantity: 0,
          },
        },
      },
    });

    // Create Order A requesting 8 units
    const enqA = await request(app).post('/api/enquiries').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: testCustomer.id, required_date: '2026-12-31', items: [{ product_id: concurrencyProd.id, quantity: 8 }] });
    const quoA = await request(app).post('/api/quotations').set('Authorization', `Bearer ${salesToken}`)
      .send({ enquiry_id: enqA.body.enquiry.id, valid_until: '2026-12-31', items: [{ product_id: concurrencyProd.id, quantity: 8, unit_price: 1000, discount_percent: 0, gst_percent: 18 }] });
    await request(app).patch(`/api/quotations/${quoA.body.quotation.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'ACCEPTED' });
    const orderA = await request(app).post(`/api/quotations/${quoA.body.quotation.id}/convert`).set('Authorization', `Bearer ${salesToken}`);

    // Create Order B requesting 5 units
    const enqB = await request(app).post('/api/enquiries').set('Authorization', `Bearer ${salesToken}`)
      .send({ customer_id: testCustomer.id, required_date: '2026-12-31', items: [{ product_id: concurrencyProd.id, quantity: 5 }] });
    const quoB = await request(app).post('/api/quotations').set('Authorization', `Bearer ${salesToken}`)
      .send({ enquiry_id: enqB.body.enquiry.id, valid_until: '2026-12-31', items: [{ product_id: concurrencyProd.id, quantity: 5, unit_price: 1000, discount_percent: 0, gst_percent: 18 }] });
    await request(app).patch(`/api/quotations/${quoB.body.quotation.id}/status`).set('Authorization', `Bearer ${salesToken}`).send({ status: 'ACCEPTED' });
    const orderB = await request(app).post(`/api/quotations/${quoB.body.quotation.id}/convert`).set('Authorization', `Bearer ${salesToken}`);

    // Total stock = 10. Order A needs 8, Order B needs 5 (Total = 13 > 10). Only ONE can succeed!
    const [resA, resB] = await Promise.all([
      request(app).post(`/api/sales-orders/${orderA.body.sales_order.id}/confirm`).set('Authorization', `Bearer ${adminToken}`),
      request(app).post(`/api/sales-orders/${orderB.body.sales_order.id}/confirm`).set('Authorization', `Bearer ${adminToken}`),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Verify final reserved quantity is exactly either 8 or 5 (not double counted or > 10)
    const finalInv = await prisma.inventory.findUnique({
      where: { product_id: concurrencyProd.id },
    });

    expect([5, 8]).toContain(finalInv.reserved_quantity);
    expect(finalInv.reserved_quantity).toBeLessThanOrEqual(finalInv.physical_quantity);
  });

  /**
   * TEST 7: Admin Inventory Restocking
   */
  test('7. ADMIN can restock inventory physical quantity', async () => {
    const invBefore = await prisma.inventory.findUnique({
      where: { product_id: testProduct1.id },
    });

    const restockRes = await request(app)
      .post('/api/inventory/restock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_id: testProduct1.id, quantity: 50 });

    expect(restockRes.status).toBe(200);
    expect(restockRes.body.inventory.physical_quantity).toBe(invBefore.physical_quantity + 50);

    // Sales user hitting restock -> 403 Forbidden
    const unauthRestock = await request(app)
      .post('/api/inventory/restock')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ product_id: testProduct1.id, quantity: 50 });

    expect(unauthRestock.status).toBe(403);
  });
});

