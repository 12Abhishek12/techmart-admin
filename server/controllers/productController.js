const db = require('../config/db');

// 1. Get all products (with category name and low-stock flag)
exports.getAllProducts = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.sku, 
        p.price, 
        p.stock_quantity, 
        p.low_stock_threshold, 
        p.image_url, 
        c.name AS category_name,
        CASE 
          WHEN p.stock_quantity <= p.low_stock_threshold THEN true 
          ELSE false 
        END AS is_low_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    const [products] = await db.query(query);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Add a new product
exports.createProduct = async (req, res) => {
  const { title, sku, price, stock_quantity, low_stock_threshold, category_id, image_url } = req.body;

  if (!title || !sku || !price) {
    return res.status(400).json({ success: false, message: 'Title, SKU, and price are required' });
  }

  try {
    const query = `
      INSERT INTO products (title, sku, price, stock_quantity, low_stock_threshold, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      title,
      sku,
      price,
      stock_quantity || 0,
      low_stock_threshold || 5,
      category_id || null,
      image_url || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Product SKU already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Update stock quantity & price
exports.updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { stock_quantity, price } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE products SET stock_quantity = COALESCE(?, stock_quantity), price = COALESCE(?, price) WHERE id = ?',
      [stock_quantity, price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Stock/Price updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. External API Ingestion: Load electronics products from external mock API
exports.seedFromExternalAPI = async (req, res) => {
  try {
    // Uses native fetch (available in Node.js 18+)
    const response = await fetch('https://fakestoreapi.com/products/category/electronics');
    const externalProducts = await response.json();

    let insertedCount = 0;
    for (const item of externalProducts) {
      const sku = `ELEC-${item.id}-${Math.floor(1000 + Math.random() * 9000)}`;
      const query = `
        INSERT IGNORE INTO products (title, sku, price, stock_quantity, low_stock_threshold, category_id, image_url)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `;
      const [result] = await db.query(query, [
        item.title,
        sku,
        item.price,
        Math.floor(Math.random() * 20) + 1, // Random stock between 1-20
        5,
        item.image
      ]);
      if (result.affectedRows > 0) insertedCount++;
    }

    res.json({
      success: true,
      message: `Successfully ingested ${insertedCount} products from external electronics API.`,
      totalFetched: externalProducts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};