# PERN ERP Case Study — Industrial Supply Chain System

A production-ready PERN (PostgreSQL, Express, React, Node.js) web application modeling the core industrial manufacturing & supply chain workflow:

```
Customer Enquiry ➔ Quotation ➔ Sales Order ➔ Inventory Reservation ➔ Dispatch
```

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite, Functional Components, Hooks, Context API, Tailwind CSS, Lucide Icons)
- **Backend**: Node.js + Express.js (CommonJS, Zod validation, Centralized Error Handler)
- **Database**: PostgreSQL (via `embedded-postgres` or local Docker/native PostgreSQL)
- **ORM**: Prisma ORM (Strict relational modeling, Decimal money types, FK constraints, Unique constraints)
- **Authentication**: JWT (JSON Web Tokens) + `bcryptjs` password hashing + Express Role-Based Authorization Middleware (`ADMIN` & `SALES_USER`)
- **Testing**: Jest + Supertest (6 automated tests including concurrent reservation simulation)

---

## 🔐 Test Login Credentials

| Role | Email | Password | Allowed Actions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@fundsroom.com` | `Admin@123` | Full access: View all records, Confirm Sales Orders (reserves inventory), Process Dispatches |
| **SALES_USER** | `sales@fundsroom.com` | `Sales@123` | Create Enquiries, Draft Quotations, Accept/Reject Quotations, Convert to Sales Order, View Inventory (read-only) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ LTS (`node -v`)
- **Git**: Installed (`git -v`)

### 2. Installation

Clone the repository and install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup (Automated)

The backend comes pre-configured with `embedded-postgres` for zero-setup execution.

```bash
cd backend

# Start local PostgreSQL database server on port 5432
node scripts/start-db.js

# Sync Prisma Schema with PostgreSQL database
npx prisma db push

# Seed initial test data (Users, Industrial Products, Inventory, Customers)
node prisma/seed.js
```

### 4. Running the Application

In terminal 1 (Backend API Server on `http://localhost:5000`):
```bash
cd backend
npm run dev
# or: npm start
```

In terminal 2 (Frontend React App on `http://localhost:3000`):
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your web browser and log in with the test credentials above.

---

## 🧪 Running Automated Tests

Run the full Jest + Supertest suite (covers all 5 mandatory test scenarios + 1 bonus concurrency test):

```bash
cd backend
npm test
```

### Test Coverage Highlights:
1. **Server-Side Quotation Math**: Asserts `line_amount = (qty * price) * (1 - discount/100) * (1 + gst/100)` and `grand_total` server calculations.
2. **Quotation Status Guard**: Verifies `DRAFT` or `REJECTED` quotations cannot be converted into Sales Orders (HTTP 400).
3. **Double Conversion Guard**: Verifies unique constraint on `sales_orders.quotation_id` prevents duplicate order creation (HTTP 409).
4. **Over-Reservation Guard**: Verifies attempts to reserve more than available inventory are rejected and stock remains unchanged (HTTP 400).
5. **Role Security**: Verifies `SALES_USER` attempting to hit `/sales-orders/:id/confirm` receives HTTP 403 Forbidden.
6. **Bonus Concurrency Test**: Fires `Promise.all` near-simultaneous confirmation calls against limited stock and asserts only 1 succeeds with zero double-counting.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgresPassword@localhost:5432/erp_db?schema=public"
JWT_SECRET="super-secret-jwt-key-for-erp-case-study"
```

---

## ⚡ Concurrency & Inventory Reservation Solution

### The Scenario
A product has `available_quantity = 100` (`physical_quantity - reserved_quantity`). Two near-simultaneous requests try to reserve `80` units and `50` units. Only one request must succeed, or the second request must be revalidated against post-reservation availability.

### Our Solution Architecture
We use **Prisma Interactive Transactions (`$transaction`)** combined with **Atomic Conditional Database Updates (`$executeRaw`)**.

```sql
UPDATE inventory 
SET reserved_quantity = reserved_quantity + :requestedQty
WHERE product_id = :productId 
  AND (physical_quantity - reserved_quantity) >= :requestedQty;
```

### Why This Solution is Bulletproof:
1. **Database-Level Atomicity**: In PostgreSQL, an `UPDATE` statement evaluates its `WHERE` clause against the latest committed state of the target row under row-level lock.
2. **No Double-Counting / Over-Reservation**: If Request A updates `reserved_quantity` from 0 to 80, the row is committed. When Request B executes its update, PostgreSQL checks `(100 - 80) >= 50` which evaluates to `false` (20 < 50). The query updates `0` rows.
3. **Rollback Safety**: If any item in a multi-product order fails this atomic conditional update, the transaction throws an error, rolling back all prior updates in that batch (All-or-Nothing reservation).

---

## 📊 Database Schema & ER Diagram

Detailed Mermaid ER Diagram available at [`docs/er-diagram.md`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/er-diagram.md).

### Entity Overview:
- `users`: ID, name, email, password_hash, role (`ADMIN`, `SALES_USER`)
- `customers`: ID, company_name, contact_person, mobile, email, city
- `products`: ID, product_code (unique), product_name, category, unit, base_price (Decimal)
- `inventory`: ID, product_id (unique FK), physical_quantity, reserved_quantity. Derived: `available_quantity = physical - reserved`.
- `enquiries` & `enquiry_items`: Enquiry header & line items.
- `quotations` & `quotation_items`: Quotations with server-calculated prices, GST %, discount %.
- `sales_orders` & `sales_order_items`: Sales Orders with `quotation_id` unique constraint.
- `dispatches` & `dispatch_items`: Dispatch details (vehicle_number, driver_name).

---

## 📑 Postman API Collection

Postman Collection JSON file available at [`docs/ERP_API_Collection.json`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/ERP_API_Collection.json). Import this file into Postman, Thunder Client, or Bruno to inspect and test all API endpoints.

---

## 💡 Live Round Quick Guide

### 1. How to add `damaged_quantity`:
1. In `schema.prisma`: add `damaged_quantity Int @default(0)` to model `Inventory`.
2. Update formula in `productController.js` and queries:
   `available_quantity = physical_quantity - reserved_quantity - damaged_quantity`.
3. Update `POST /inventory/damaged` endpoint to increment `damaged_quantity`.

### 2. How to cancel a CONFIRMED Sales Order:
1. In `salesOrderController.js`: add `cancelSalesOrder` endpoint.
2. Inside `$transaction`: check status is `CONFIRMED`.
3. For each line item: decrement `reserved_quantity = reserved_quantity - quantity`.
4. Update Sales Order status to `CANCELLED`.
