# 🏭 FundsRoom ERP — Industrial Supply Chain & Control Ledger

> A full-stack PERN (**P**ostgreSQL, **E**xpress.js, **R**eact.js, **N**ode.js) Enterprise Resource Planning (ERP) application engineered for industrial manufacturing and supply chain management.

---

## 💡 What is FundsRoom ERP?

**FundsRoom ERP** is an internal B2B control system built for industrial supply chain operations (e.g. valves, bearings, hoses). It streamlines the full commercial pipeline between **Company Sales Representatives**, **Warehouse Admins**, and **B2B Industrial Customers**:

```
Customer Enquiry  ➔  Quotation  ➔  Sales Order  ➔  Inventory Reservation  ➔  Dispatch
```

### Key Highlights
- **100% Legible, Kit-Free Interface**: Redesigned UI System v2 using **Public Sans** for clear typography, **IBM Plex Mono** for financial/numeric ledger metrics, deep teal (`#1F5C73`) accents, 1px crisp borders, and **zero generic SaaS card shadow bloat**.
- **Server-Side Financial Accuracy**: Precision tax (GST) and discount calculations performed strictly on the backend using Prisma `Decimal` types.
- **Double Conversion Guard**: Hardened database unique constraint preventing duplicate Sales Order creation from the same Quotation.
- **Atomic Concurrency Stock Locking**: Row-level database transactions preventing over-reservation during simultaneous sales orders.
- **Admin Inventory Restocking**: Built-in Admin stock entry modal and API for receiving supplier shipments and adding physical stock.

---

## 🏢 How the Internal Workflow Operates

| Stage | Role | What Happens Behind the Scenes |
| :--- | :--- | :--- |
| **1. Enquiry** | **Sales Rep** | Log customer requirement for industrial SKUs (`NEW` status). |
| **2. Quotation** | **Sales Rep** | Set unit prices, item discounts, and GST %. System calculates line totals. Rep marks `SENT`, then `ACCEPTED` upon customer approval. |
| **3. Sales Order** | **Sales Rep** | Convert `ACCEPTED` Quotation into a `PENDING` Sales Order. Database enforces strict 1-to-1 conversion. |
| **4. Reservation** | **Admin** | Admin locks stock (`CONFIRMED`). Backend executes an atomic SQL query: `reserved_quantity = reserved_quantity + qty`. Available stock (`physical - reserved`) decreases. |
| **5. Dispatch** | **Admin** | Enter transport vehicle & driver details (`DISPATCHED`). Decrements both `physical_quantity` and `reserved_quantity` simultaneously. |
| **6. Restocking** | **Admin** | When shipments arrive or stock reaches 0, Admin adds physical units via the **+ Add Stock** modal. |

---

## 🎨 Design System v2 — Principles

The user interface was built following strict enterprise control-room standards:
1. **Clear Actions Over Icon Menus**: Every action (`Mark Sent`, `Accept`, `Reject`, `Convert to Sales Order`, `Confirm & Reserve Stock`, `Cancel`, `Dispatch`) is an explicit, visible button with standard color coding.
2. **Plain Text Pipeline Breadcrumbs**: Highlighting current stage progress without decorative gradient cards or circular badges:
   Enquiry → Quotation → Sales Order → Reservation → Dispatch
3. **Ledger Numeric Formatting**: Currency values (`₹`), SKU codes (`PROD-001`), and quantities display in monospace `IBM Plex Mono` for rapid scanning.
4. **Low Stock Visual Cues**: Items with available stock under 50 units display a `3px solid amber` left indicator line.

---

## 🛠️ System Architecture & Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS, Public Sans & IBM Plex Mono fonts.
- **Backend**: Node.js, Express.js (RESTful API), Zod validation, JWT Authentication, Role-based Middleware (`ADMIN`, `SALES_USER`).
- **Database & ORM**: PostgreSQL, Prisma ORM (Relational schemas, Foreign key constraints, Unique indexes, Decimal monetary types).
- **Automated Testing**: Jest + Supertest (7 automated test suites covering workflow guards and concurrent locking).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/singuharshith/Fundsroom-PERN-ERP.git
cd Fundsroom-PERN-ERP

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Initialization & Seeding

```bash
cd backend

# Start local PostgreSQL database
node scripts/start-db.js

# Sync Prisma Schema with Database
npx prisma db push

# Seed initial users, products, inventory, and customers
node prisma/seed.js
```

### 3. Run Development Servers

**Terminal 1 — Backend API (`http://localhost:5000`):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend App (`http://localhost:3000`):**
```bash
cd frontend
npm run dev
```

**Terminal 3 (Optional) — Prisma Studio (`http://localhost:5555`):**
```bash
cd backend
npx prisma studio --port 5555
```

---

## 🔑 Test User Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@fundsroom.com` | `Admin@123` | Full control: Confirm & Reserve stock, Dispatch orders, Cancel orders, Restock physical inventory. |
| **SALES_USER** | `sales@fundsroom.com` | `Sales@123` | Commercial operations: Create enquiries, Draft/Send/Accept quotations, Convert to sales orders. |

---

## 🧪 Automated Test Suite

Run the full automated test suite using Jest:

```bash
cd backend
npm test
```

### Verified Test Cases (7/7 Passed):
1. **Server-Side Quotation Math**: Verifies line item amounts and tax/discount calculations.
2. **Quotation Status Guard**: Asserts `DRAFT` or `REJECTED` quotations cannot be converted into Sales Orders (HTTP 400).
3. **Double Conversion Guard**: Verifies duplicate conversion attempts return HTTP 409 Conflict.
4. **Over-Reservation Protection**: Asserts requests exceeding available stock are rejected and stock remains untouched (HTTP 400).
5. **Role Authorization**: Asserts `SALES_USER` hitting Admin confirm endpoints receives HTTP 403 Forbidden.
6. **Concurrent Reservation Guard (`Promise.all`)**: Simulates simultaneous confirmation calls against limited stock; asserts only one succeeds with zero double-counting.
7. **Admin Inventory Restocking**: Asserts Admin can restock physical stock while non-admin attempts are rejected (HTTP 403).

---

## 📁 Repository Structure

```
Fundsroom-PERN-ERP/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & relations
│   │   └── seed.js             # Seed initial database records
│   ├── scripts/
│   │   └── start-db.js         # Embedded PostgreSQL launcher
│   ├── src/
│   │   ├── controllers/        # Business logic & transaction handlers
│   │   ├── middleware/         # JWT Auth & Role Authorization
│   │   ├── routes/             # REST API routes
│   │   └── tests/              # Jest automated test suite
│   └── server.js               # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, WorkflowTracker, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT & User state)
│   │   ├── pages/              # Enquiries, Quotations, Sales Orders, Inventory, Login
│   │   └── index.css           # Design Tokens v2 & Tailwind styles
│   ├── index.html              # HTML shell & font imports
│   └── vite.config.js          # Vite configuration & proxy settings
└── README.md                   # System documentation
```

---

## 📜 License & Acknowledgments

Developed as a PERN ERP Case Study for **FundsRoom**. Built with precision for legibility, stability, and scale.

