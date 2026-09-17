# 🎯 Technical Case Study — Live Presentation & Examiner's Guide

This guide is specifically written to help you navigate, present, and explain the ERP application effortlessly during your evaluation and live verification round.

---

## 🚀 5-Minute Live Demo Script (Step-by-Step)

Follow this exact sequence to demonstrate the entire business workflow:

### Step 1: Log in as Sales Representative
1. Open `http://localhost:3000` in your browser.
2. Click the **SALES_USER** quick-fill button (`sales@fundsroom.com` / `Sales@123`) and click **Sign in**.

### Step 2: Create a Customer Enquiry
1. Navigate to **Enquiries** page.
2. Click **Create Enquiry**.
3. Select Customer `Acme Industrial Solutions Ltd`, pick a target date, and select product `Deep Groove Ball Bearing 6205` with Quantity `20`.
4. Click **Record enquiry**. Status starts at `NEW`.

### Step 3: Draft & Accept a Quotation
1. Navigate to **Quotations** page.
2. Click **Draft quotation**.
3. Select the Enquiry created above (`ENQ-0002`). Notice how line items populate automatically!
4. Set Unit Price = `350.00`, Discount % = `10`, GST % = `18`.
5. Observe the live calculated total (re-verified server-side). Click **Record quotation**. Status is `DRAFT`.
6. Click **Mark sent** (Status `SENT`), then click **Accept** (Status `ACCEPTED`).

### Step 4: Convert Quotation to Sales Order
1. Click **Convert to order** next to the ACCEPTED quotation.
2. Order `SO-0002` is created with status `PENDING`.
3. *(Optional Examiner Check)*: Try clicking "Convert to order" again — observe the system blocks it with HTTP 409 Conflict due to the database `@unique` constraint on `sales_orders.quotation_id`.

### Step 5: Switch to Admin & Reserve Stock
1. Click **Sign out** at top right.
2. Click the **ADMIN** quick-fill button (`admin@fundsroom.com` / `Admin@123`) and click **Sign in**.
3. Navigate to **Sales orders**.
4. Click **Inspect stock** on `SO-0002` to view real-time physical vs available stock.
5. Click **Reserve stock**. Order status becomes `CONFIRMED`. Notice how `Reserved Quantity` increases by 20 while `Physical Quantity` remains unchanged (per Case Study Page 5).

### Step 6: Dispatch Order
1. Click **Dispatch** on the confirmed order `SO-0002`.
2. Enter Vehicle Number `MH-12-AB-1234` and Driver Name `Suresh Patil`. Click **Confirm dispatch**.
3. Order status becomes `DISPATCHED`.
4. Navigate to **Inventory**. Observe that BOTH `Physical Quantity` (500 ➔ 480) and `Reserved Quantity` (20 ➔ 0) decreased together in a single atomic database transaction (per Case Study Page 6).

---

## 🧠 3 Questions the Evaluator Will Ask You (And How to Answer)

### Question 1: "How do you handle simultaneous concurrent reservations (Page 5 Challenge)?"
> **Your Answer**:
> *"We use a single database transaction (`$transaction`) in Prisma combined with an atomic conditional SQL update query:*
> ```sql
> UPDATE inventory 
> SET reserved_quantity = reserved_quantity + :qty
> WHERE product_id = :id AND (physical_quantity - reserved_quantity) >= :qty;
> ```
> *PostgreSQL evaluates this `WHERE` clause under a row-level lock. If User A (80) and User B (50) hit the endpoint at the exact same millisecond against 100 stock, PostgreSQL locks the row. The first request updates `reserved_quantity` to 80. When the second request executes, `(100 - 80) >= 50` evaluates to false, updating 0 rows and rolling back the second transaction automatically."*

### Question 2: "How is your PostgreSQL database structured?"
> **Your Answer**:
> *"We have 12 relational entities in PostgreSQL connected via foreign keys. We do not use JSON blobs to avoid relational design. To prevent duplicate order generation, `sales_orders.quotation_id` has a strict `@unique` constraint at the database engine level. Monetary values use `@db.Decimal(12, 2)` instead of floating-point numbers."*

### Question 3: "How is security and role authorization enforced?"
> **Your Answer**:
> *"Auth is handled via signed JWT tokens and bcrypt password hashing. Backend protection is enforced via Express middleware (`auth.js` and `roleCheck.js`). Restricted endpoints like `/sales-orders/:id/confirm` and `/sales-orders/:id/dispatch` verify `req.user.role === 'ADMIN'` on the server. Bypassing the React UI via Postman still results in an HTTP 403 Forbidden error."*

---

## 🛠️ Live Verification Round Cheat-Sheet (Page 11 of PDF)

The evaluator may ask you to make one of these two unannounced live code changes in 20 minutes:

---

### 🚨 Live Challenge 1: Add `DAMAGED` stock

**Requirement**: Add `damaged_quantity` to inventory. Formula becomes:
$$\text{Available} = \text{Physical} - \text{Reserved} - \text{Damaged}$$

#### Step 1: Update `backend/prisma/schema.prisma`
In model `Inventory`, add:
```prisma
damaged_quantity Int @default(0)
```

#### Step 2: Push database schema change
Run in `backend/` terminal:
```bash
npx prisma db push
```

#### Step 3: Update `backend/src/controllers/productController.js`
In `getProducts` and `getInventory`, update the formula:
```js
available_quantity: item.physical_quantity - item.reserved_quantity - item.damaged_quantity
```

---

### 🚨 Live Challenge 2: Allow Order Cancellation

**Requirement**: Allow `CONFIRMED` Sales Order to be `CANCELLED` and release (decrement) its reserved stock.

#### Add function to `backend/src/controllers/salesOrderController.js`:
```js
const cancelSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order || order.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Only CONFIRMED orders can be cancelled.' });
    }

    await prisma.$transaction(async (tx) => {
      // Release (decrement) reserved stock
      for (const item of order.items) {
        await tx.inventory.update({
          where: { product_id: item.product_id },
          data: { reserved_quantity: { decrement: item.quantity } }
        });
      }
      await tx.salesOrder.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
    });

    res.json({ message: 'Order cancelled and reserved inventory released successfully.' });
  } catch (error) { next(error); }
};
```
Add route to `salesOrderRoutes.js`:
```js
router.post('/:id/cancel', requireRole('ADMIN'), cancelSalesOrder);
```
