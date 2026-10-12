const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    const [categories] = await db.query('SELECT COUNT(*) AS total_categories FROM categories');

    res.json({
      status: 'success',
      message: 'TechMart Backend connected to MySQL Database!',
      dbCheck: rows[0].result,
      categoriesCount: categories[0].total_categories
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to MySQL database',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`TechMart Server running at: http://localhost:${PORT}`);
  console.log(`===============================================`);
});