let allOrders = [];

async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><div class="spinner-border text-primary spinner-border-sm"></div> Loading orders...</td></tr>`;

  try {
    const res = await fetch('/api/orders');
    const data = await res.json();

    if (data.success) {
      allOrders = data.data;
      renderOrders(allOrders);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${data.error}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error connecting to server</td></tr>`;
  }
}

function getBadgeClass(status) {
  switch (status) {
    case 'Pending': return 'bg-warning-subtle text-dark border border-warning';
    case 'Processing': return 'bg-primary-subtle text-primary border border-primary';
    case 'Shipped': return 'bg-info-subtle text-info border border-info';
    case 'Delivered': return 'bg-success-subtle text-success border border-success';
    case 'Cancelled': return 'bg-danger-subtle text-danger border border-danger';
    default: return 'bg-secondary';
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No orders yet. Click "Simulate Customer Order" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.order_number}</strong></td>
      <td>
        <div class="fw-semibold">${o.customer_name}</div>
        <div class="text-muted small">${o.customer_email}</div>
      </td>
      <td class="text-muted small">${new Date(o.created_at).toLocaleDateString()}</td>
      <td class="fw-bold">$${parseFloat(o.total_amount).toFixed(2)}</td>
      <td>
        <span class="badge ${getBadgeClass(o.status)} px-3 py-2">${o.status}</span>
      </td>
      <td class="text-end">
        <select class="form-select form-select-sm d-inline-block w-auto" onchange="changeStatus(${o.id}, this.value)" ${o.status === 'Delivered' || o.status === 'Cancelled' ? 'disabled' : ''}>
          <option value="" disabled selected>Advance Stage...</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancel Order</option>
        </select>
      </td>
    </tr>
  `).join('');
}

async function changeStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      loadOrders();
    } else {
      alert(data.message || 'Status update failed');
      loadOrders();
    }
  } catch (err) {
    alert('Server error');
  }
}

// Populate product dropdown in modal
async function populateProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('orderProductSelect');
      select.innerHTML = data.data.map(p => `
        <option value="${p.id}">${p.title} (Stock: ${p.stock_quantity}) - $${p.price}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to populate products', err);
  }
}

// Submit Simulated Order
async function handleCreateOrder(e) {
  e.preventDefault();
  const payload = {
    customer_name: document.getElementById('custName').value,
    customer_email: document.getElementById('custEmail').value,
    items: [
      {
        product_id: parseInt(document.getElementById('orderProductSelect').value),
        quantity: parseInt(document.getElementById('orderQty').value)
      }
    ]
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    bootstrap.Modal.getInstance(document.getElementById('createOrderModal')).hide();
    loadOrders();
    alert(`Order ${data.orderNumber} placed successfully! Stock was automatically deducted.`);
  } else {
    alert(data.message || 'Failed to place order');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  populateProducts();
});