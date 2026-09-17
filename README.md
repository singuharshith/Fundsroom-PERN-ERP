# FundsRoom ERP — Industrial Supply Chain & Control Ledger

> A full-stack PERN (PostgreSQL, Express.js, React.js, Node.js) Enterprise Resource Planning application engineered for industrial manufacturing and supply chain management.

---

## 1. System Overview

**FundsRoom ERP** is an internal enterprise resource planning system built to handle commercial supply chain operations (such as industrial valves, bearings, and hoses). It manages the complete commercial workflow across Sales Representatives, Warehouse Administrators, and B2B Industrial Clients:

```
Customer Enquiry  ->  Quotation  ->  Sales Order  ->  Inventory Reservation  ->  Dispatch
```

### Core Technical Features
- **High-Legibility Control Interface**: Redesigned UI System using Public Sans for UI typography, IBM Plex Mono for monetary and quantitative data, deep teal (`#1F5C73`) primary highlights, 1px crisp borders, and zero decorative drop shadows.
- **Server-Side Financial Accuracy**: Precision tax (GST) and discount calculations computed on the backend using Prisma `Decimal` data types.
- **Double Conversion Protection**: Unique database constraint preventing duplicate Sales Order generation from the same Quotation.
- **Atomic Stock Locking**: Row-level database transactions preventing over-reservation during concurrent sales orders.
- **Admin Inventory Restocking**: Dedicated Admin stock entry workflow and REST endpoint for recording incoming supplier shipments.

---

## 2. Business Workflow Architecture

| Stage | Authorized Role | Technical Operation |
| :--- | :--- | :--- |
| **1. Enquiry** | **Sales Representative** | Log customer requirement for industrial SKUs (`NEW` status). |
| **2. Quotation** | **Sales Representative** | Input unit price, discount percentage, and GST percentage. Backend computes line totals and grand total. Status advances to `SENT`, then `ACCEPTED`. |
| **3. Sales Order** | **Sales Representative** | Convert `ACCEPTED` Quotation into a `PENDING` Sales Order. Enforces 1-to-1 conversion via database constraint. |
| **4. Inventory Reservation** | **Warehouse Admin** | Admin confirms order (`CONFIRMED`). Backend executes atomic transaction: `reserved_quantity = reserved_quantity + qty`. Available stock (`physical - reserved`) decreases. |
| **5. Dispatch** | **Warehouse Admin** | Record transport vehicle and driver details (`DISPATCHED`). Decrements both `physical_quantity` and `reserved_quantity` atomically. |
| **6. Restocking** | **Warehouse Admin** | When new shipments arrive or stock reaches 0, Admin adds physical units via the Restock modal. |

---

## 3. Design System Principles

The user interface follows strict industrial control-room design rules:
1. **Explicit Action Buttons**: Actions (`Mark Sent`, `Accept`, `Reject`, `Convert to Sales Order`, `Confirm & Reserve Stock`, `Cancel`, `Dispatch`) are visible, clearly labeled buttons rather than hidden dropdown menus.
2. **Text-Based Stage Tracking**: Plain text breadcrumb showing stage progression without circular badges or gradient fills:
   Enquiry -> Quotation -> Sales Order -> Reservation -> Dispatch
3. **Monospace Metric Formatting**: Monospace font (`IBM Plex Mono`) applied to currency values (`₹`), SKU codes, and quantities for rapid scanning.
4. **Low Stock Alerts**: Products with available stock below 50 units display an amber border indicator.

---

## 4. System Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS, Public Sans & IBM Plex Mono fonts.
- **Backend**: Node.js, Express.js (RESTful API), Zod validation, JWT Authentication, Role-based Middleware (`ADMIN`, `SALES_USER`).
- **Database & ORM**: PostgreSQL, Prisma ORM (Relational schemas, Foreign key constraints, Unique indexes, Decimal monetary types).
- **Automated Testing**: Jest + Supertest (7 automated test suites covering workflow guards and concurrent locking).

---

## 5. Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Clone Repository & Install Dependencies

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

### Step 2: Database Setup & Seeding

```bash
cd backend

# Start local PostgreSQL database
node scripts/start-db.js

# Apply Prisma Schema to Database
npx prisma db push

# Seed initial system users, products, inventory, and customers
node prisma/seed.js
```

### Step 3: Run Application

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

## 6. Authentication & Roles

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@fundsroom.com` | `Admin@123` | Full administrative control: Reserve inventory, dispatch orders, cancel orders, and restock physical stock. |
| **SALES_USER** | `sales@fundsroom.com` | `Sales@123` | Commercial operations: Create enquiries, draft/send/accept quotations, and convert to sales orders. |

---

## 7. Automated Test Suite

Run the test suite using Jest:

```bash
cd backend
npm test
```

### Test Case Verification Summary (7/7 Passed):
1. **Server-Side Quotation Math**: Validates line item calculations, discount deductions, and GST application.
2. **Quotation Status Guard**: Verifies `DRAFT` or `REJECTED` quotations cannot be converted into Sales Orders (HTTP 400).
3. **Double Conversion Guard**: Verifies duplicate conversion attempts return HTTP 409 Conflict.
4. **Over-Reservation Guard**: Verifies requests exceeding available stock are rejected and stock remains unchanged (HTTP 400).
5. **Role Security**: Verifies `SALES_USER` hitting Admin endpoints receives HTTP 403 Forbidden.
6. **Concurrent Reservation Guard (`Promise.all`)**: Simulates simultaneous confirmation calls against limited stock; asserts only one succeeds with zero double-counting.
7. **Admin Inventory Restocking**: Verifies Admin can restock physical stock while non-admin attempts are rejected (HTTP 403).

---

## 8. Directory Structure

```
Fundsroom-PERN-ERP/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & entity definitions
│   │   └── seed.js             # Initial database seed script
│   ├── scripts/
│   │   └── start-db.js         # Embedded PostgreSQL server launcher
│   ├── src/
│   │   ├── controllers/        # Business controllers & transaction logic
│   │   ├── middleware/         # Auth & Role authorization middleware
│   │   ├── routes/             # API route definitions
│   │   └── tests/              # Jest automated test suite
│   └── server.js               # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared components (Navbar, WorkflowTracker)
│   │   ├── context/            # AuthContext state management
│   │   ├── pages/              # Enquiries, Quotations, Sales Orders, Inventory, Login
│   │   └── index.css           # Design tokens & base styles
│   ├── index.html              # Entry HTML file
│   └── vite.config.js          # Vite build configuration
└── README.md                   # System documentation
```

---

## 9. Conclusion

Developed as a PERN ERP Case Study submission for FundsRoom. Focuses on robust data modeling, strict role-based authorization, and clean operational user experience.


