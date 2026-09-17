# PERN ERP Case Study — Industrial Supply Chain System

A production-ready PERN (PostgreSQL, Express, React, Node.js) web application modeling the core industrial manufacturing & supply chain workflow:

```
Customer Enquiry ➔ Quotation ➔ Sales Order ➔ Inventory Reservation ➔ Dispatch
```

---

## 🎯 Live Presentation & Examiner's Guide

> **Important**: For step-by-step instructions on presenting the demo and answering evaluator questions, open [`docs/DEMO_EXAMINER_GUIDE.md`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/DEMO_EXAMINER_GUIDE.md).

### Quick 5-Minute Live Demo Sequence:
1. **Log in as Sales Rep**: Go to `http://localhost:3000`, click **SALES_USER** quick-fill button (`sales@fundsroom.com` / `Sales@123`).
2. **Log Enquiry**: Go to **Enquiries** ➔ Click **Create enquiry** ➔ Select customer `Acme Industrial Solutions Ltd` & 20 bearings.
3. **Draft & Accept Quotation**: Go to **Quotations** ➔ Click **Draft quotation** ➔ Select enquiry ➔ Set unit price ₹350, 10% disc, 18% GST. Mark **Sent** then **Accept**.
4. **Convert to Sales Order**: Click **Convert to order** on the ACCEPTED quotation.
5. **Switch to Admin & Reserve Stock**: Sign out ➔ Log in as **ADMIN** (`admin@fundsroom.com` / `Admin@123`). Go to **Sales orders** ➔ Click **Reserve stock**. (Notice reserved quantity increases while physical stock stays unchanged).
6. **Dispatch Order**: Click **Dispatch** ➔ Enter vehicle number `MH-12-AB-1234` & driver name `Suresh Patil`. (Notice physical & reserved stock both decrement together).

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite, Functional Components, Hooks, Context API, IBM Plex Typography, Tailwind CSS)
- **Backend**: Node.js + Express.js (CommonJS, Zod validation, Centralized Error Handler)
- **Database**: PostgreSQL (via `embedded-postgres` or local PostgreSQL)
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

### 1. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup (Automated)

```bash
cd backend

# Start local PostgreSQL server
node scripts/start-db.js

# Sync Prisma Schema with PostgreSQL database
npx prisma db push

# Seed test data (Users, Industrial Products, Inventory, Customers)
node prisma/seed.js
```

### 3. Running the Application

Terminal 1 (Backend API Server on `http://localhost:5000`):
```bash
cd backend
npm start
```

Terminal 2 (Frontend React App on `http://localhost:3000`):
```bash
cd frontend
npm run dev
```

---

## 🧪 Running Automated Tests

Run the full Jest + Supertest suite (covers all 5 mandatory test scenarios + 1 bonus concurrency test):

```bash
cd backend
npm test
```

### Test Results Summary:
1. **Server-Side Quotation Math**: Asserts `line_amount = (qty * price) * (1 - discount/100) * (1 + gst/100)` and `grand_total` calculations.
2. **Quotation Status Guard**: Verifies `DRAFT` or `REJECTED` quotations cannot be converted into Sales Orders (HTTP 400).
3. **Double Conversion Guard**: Verifies unique constraint on `sales_orders.quotation_id` prevents duplicate order creation (HTTP 409).
4. **Over-Reservation Guard**: Verifies attempts to reserve more than available inventory are rejected and stock remains unchanged (HTTP 400).
5. **Role Security**: Verifies `SALES_USER` attempting to hit `/sales-orders/:id/confirm` receives HTTP 403 Forbidden.
6. **Bonus Concurrency Test**: Fires `Promise.all` near-simultaneous confirmation calls against limited stock and asserts only 1 succeeds with zero double-counting.

---

## ⚡ Concurrency & Inventory Reservation Solution

### The Scenario
Available stock = 100 (`physical - reserved`). Two requests try to reserve `80` units and `50` units simultaneously. Only one request must succeed.

### Our Solution Architecture
Prisma `$transaction` + Atomic Conditional SQL Update:

```sql
UPDATE inventory 
SET reserved_quantity = reserved_quantity + :requestedQty
WHERE product_id = :productId 
  AND (physical_quantity - reserved_quantity) >= :requestedQty;
```

PostgreSQL evaluates the `WHERE` clause under row-level lock. If Request A reserves 80, Request B sees `(100 - 80) >= 50` (20 < 50) which evaluates to `false`, updating 0 rows and rolling back transaction B automatically.

---

## 📊 Deliverables & Links

- **Live Examiner's Guide**: [`docs/DEMO_EXAMINER_GUIDE.md`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/DEMO_EXAMINER_GUIDE.md)
- **Mermaid ER Diagram**: [`docs/er-diagram.md`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/er-diagram.md)
- **Postman API Collection**: [`docs/ERP_API_Collection.json`](file:///c:/Users/Harshith%20singu/Downloads/case%20study2(fundsroom)/docs/ERP_API_Collection.json)
