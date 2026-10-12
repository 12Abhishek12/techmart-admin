let allProducts = [];

// Fetch products from backend API
async function loadProducts() {
  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border text-primary spinner-border-sm"></div> Fetching products...</td></tr>`;

  try {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (data.success) {
      allProducts = data.data;
      renderTable(allProducts);
      updateMetrics(allProducts);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${data.error || 'Failed to load products'}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error connecting to server</td></tr>`;
  }
}

// Render product list to table
function renderTable(products) {
  const tbody = document.getElementById('productTableBody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td class="text-muted small">#${p.id}</td>
      <td>
        <div class="d-flex align-items-center gap-3">
          <img src="${p.image_url || 'https://via.placeholder.com/50'}" alt="${p.title}" class="product-img-thumb border" />
          <div>
            <div class="fw-semibold text-truncate" style="max-width: 280px;" title="${p.title}">${p.title}</div>
            <span class="badge bg-light text-dark border small">${p.category_name || 'Electronics'}</span>
          </div>
        </div>
      </td>
      <td><code>${p.sku}</code></td>
      <td class="fw-bold">$${parseFloat(p.price).toFixed(2)}</td>
      <td>
        <span class="fw-semibold">${p.stock_quantity}</span>
        <span class="text-muted small"> / min ${p.low_stock_threshold}</span>
      </td>
      <td>
        ${p.is_low_stock 
          ? `<span class="badge bg-danger-subtle text-danger border border-danger"><i class="bi bi-exclamation-triangle"></i> Low Stock</span>`
          : `<span class="badge bg-success-subtle text-success border border-success"><i class="bi bi-check2"></i> In Stock</span>`
        }
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openUpdateModal(${p.id}, '${escapeHtml(p.title)}', ${p.stock_quantity}, ${p.price})">
          <i class="bi bi-pencil-square"></i> Stock
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Update KPI cards
function updateMetrics(products) {
  const total = products.length;
  const lowStock = products.filter(p => p.is_low_stock).length;
  const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

  document.getElementById('statTotalProducts').innerText = total;
  document.getElementById('statLowStock').innerText = lowStock;
  document.getElementById('statTotalUnits').innerText = totalUnits;
}

// Filter table live as user types
function filterTable() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p => 
    p.title.toLowerCase().includes(query) || 
    p.sku.toLowerCase().includes(query)
  );
  renderTable(filtered);
}

// Open modal for editing stock
function openUpdateModal(id, title, stock, price) {
  document.getElementById('editProductId').value = id;
  document.getElementById('editProductTitle').innerText = title;
  document.getElementById('editStockQuantity').value = stock;
  document.getElementById('editPrice').value = price;
  const modal = new bootstrap.Modal(document.getElementById('updateStockModal'));
  modal.show();
}

// Submit Stock/Price update
async function handleUpdateStock(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const stock = document.getElementById('editStockQuantity').value;
  const price = document.getElementById('editPrice').value;

  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_quantity: parseInt(stock), price: parseFloat(price) })
  });

  const data = await res.json();
  if (data.success) {
    bootstrap.Modal.getInstance(document.getElementById('updateStockModal')).hide();
    loadProducts();
  } else {
    alert(data.message || 'Failed to update stock');
  }
}

// Create new product
async function handleCreateProduct(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('newTitle').value,
    sku: document.getElementById('newSku').value,
    price: parseFloat(document.getElementById('newPrice').value),
    stock_quantity: parseInt(document.getElementById('newStock').value),
    low_stock_threshold: parseInt(document.getElementById('newThreshold').value),
    image_url: document.getElementById('newImage').value
  };

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    document.getElementById('addProductForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
    loadProducts();
  } else {
    alert(data.message || 'Failed to create product');
  }
}

// Delete product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    loadProducts();
  } else {
    alert(data.message || 'Failed to delete');
  }
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'");
}

// Load on start
document.addEventListener('DOMContentLoaded', loadProducts);