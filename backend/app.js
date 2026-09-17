const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/authRoutes');
const enquiryRoutes = require('./src/routes/enquiryRoutes');
const quotationRoutes = require('./src/routes/quotationRoutes');
const salesOrderRoutes = require('./src/routes/salesOrderRoutes');
const productRoutes = require('./src/routes/productRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);

// Health check & Root status endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'FundsRoom ERP API', version: '1.0.0', health: '/api/health' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PERN ERP API is running' });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
