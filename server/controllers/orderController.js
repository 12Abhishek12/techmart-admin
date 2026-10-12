const db = require('../config/db');

// 1. Get all orders with item summary
exports.getAllOrders = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) AS total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.id DESC
    `;
    const [orders] = await db.query(query);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Create Order & Automatically Deduct Stock (Transactional)
exports.createOrder = async (req, res) => {
  const { customer_name, customer_email, items } = req.body;

  if (!customer_name || !customer_email || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Customer details and items are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;

    // Validate inventory availability for all items first
    for (const item of items) {
      const [products] = await connection.query('SELECT price, stock_quantity, title FROM products WHERE id = ?', [item.product_id]);
      if (products.length === 0) {
        throw new Error(`Product ID ${item.product_id} does not exist`);
      }
      const product = products[0];

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.title}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }

      totalAmount += product.price * item.quantity;
      item.unit_price = product.price;
    }

    // Insert order header
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const [orderResult] = await connection.query(
      'INSERT INTO orders (order_number, customer_name, customer_email, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [orderNumber, customer_name, customer_email, totalAmount, 'Pending']
    );
    const orderId = orderResult.insertId;

    // Insert order items & deduct stock
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );

      // Automated stock deduction
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderNumber,
      totalAmount
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// 3. Update Order Status (Pending -> Processing -> Shipped -> Delivered -> Cancelled)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const previousStatus = orders[0].status;

    // If order is cancelled, restore inventory
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      const [orderItems] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of orderItems) {
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    await connection.commit();
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};