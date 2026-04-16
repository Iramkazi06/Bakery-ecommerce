/* ============================================================
   dashboard.js — SweetBite Dashboard Logic
   Handles: sidebar toggle, chart rendering, stats, orders
   ============================================================ */

/**
 * Toggle sidebar collapsed state
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  sidebar?.classList.toggle('collapsed');
  main?.classList.toggle('expanded');
}

/**
 * Show mobile sidebar overlay
 */
function showMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('show');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.classList.remove('d-none');
}

function hideMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('show');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.classList.add('d-none');
}

/**
 * Initialize vendor dashboard
 */
function initVendorDashboard() {
  const session = checkSession('vendor');
  if (!session) return;

  document.getElementById('sidebarName')?.textContent !== undefined &&
    (document.getElementById('sidebarName').textContent = session.shopName || session.name);
  document.getElementById('sidebarEmail') &&
    (document.getElementById('sidebarEmail').textContent = session.email);

  loadVendorStats();
  renderRecentOrders();
  renderTopProducts();
  renderLowStock();
  initCharts();
}

/**
 * Load and animate vendor statistics
 */
function loadVendorStats() {
  const orders  = JSON.parse(localStorage.getItem('sweetbite_orders')) || [];
  const prods   = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const users   = JSON.parse(localStorage.getItem('sweetbite_users')) || [];

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending  = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  const lowStock = prods.filter(p => p.stock < 10).length;
  const customers = users.filter(u => u.role === 'customer').length;
  const today = new Date().toLocaleDateString('en-IN');
  const newToday = users.filter(u => u.registeredAt && new Date(u.registeredAt).toLocaleDateString('en-IN') === today).length;

  const el = id => document.getElementById(id);

  if (el('statRevenue'))  countUp(el('statRevenue'), revenue, '₹');
  if (el('statOrders'))   countUp(el('statOrders'), orders.length);
  if (el('statProducts')) countUp(el('statProducts'), prods.length);
  if (el('statCustomers'))countUp(el('statCustomers'), customers);

  const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  set('statPending', pending + ' pending');
  set('statLowStock', lowStock + ' low stock');
  set('statNewToday', '+' + newToday + ' today');
}

/**
 * Render recent orders table in dashboard
 */
function renderRecentOrders() {
  const sampleOrders = [
    {id:'#SB001', customer:'Priya S.', items:'Dark Truffle × 2', amount:700, status:'Delivered'},
    {id:'#SB002', customer:'Rahul M.', items:'Tiramisu × 1', amount:420, status:'Processing'},
    {id:'#SB003', customer:'Anita K.', items:'Kulfi × 3', amount:750, status:'Pending'},
    {id:'#SB004', customer:'Vikram J.', items:'Cake × 1', amount:560, status:'Delivered'},
    {id:'#SB005', customer:'Sneha R.', items:'Choco Box × 1', amount:699, status:'Processing'}
  ];

  const realOrders = JSON.parse(localStorage.getItem('sweetbite_orders')) || [];
  const combined = [...sampleOrders, ...realOrders.slice(-3).map(o => ({
    id: o.id, customer: o.customer, items: o.items?.map(i => i.name + ' × ' + i.qty).join(', ') || '',
    amount: o.total, status: o.status
  }))];

  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const statusBadge = s => {
    const map = { Delivered: 'success', Processing: 'warning text-dark', Pending: 'danger' };
    return `<span class="badge bg-${map[s] || 'secondary'}">${s}</span>`;
  };

  tbody.innerHTML = combined.slice(0, 8).map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td><small>${o.items}</small></td>
      <td><strong>₹${o.amount}</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails(${JSON.stringify(o).replace(/"/g,'&quot;')})">
          View
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Show order details in modal
 * @param {Object} order
 */
function viewOrderDetails(order) {
  const el = document.getElementById('orderDetailBody');
  if (el) {
    el.innerHTML = `
      <table class="table table-bordered">
        <tr><th>Order ID</th><td>${order.id}</td></tr>
        <tr><th>Customer</th><td>${order.customer}</td></tr>
        <tr><th>Items</th><td>${order.items}</td></tr>
        <tr><th>Amount</th><td>₹${order.amount}</td></tr>
        <tr><th>Status</th><td>${order.status}</td></tr>
      </table>
    `;
  }
  const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
  modal.show();
}

/**
 * Render top selling products list
 */
function renderTopProducts() {
  const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const top5 = [...prods].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const el = document.getElementById('topProductsList');
  if (!el) return;
  const maxPrice = Math.max(...top5.map(p => p.price));
  el.innerHTML = top5.map(p => `
    <div class="top-sell-item">
      <span class="top-sell-emoji">${p.emoji}</span>
      <div class="top-sell-info">
        <div class="d-flex justify-content-between">
          <span class="fw-bold small">${p.name}</span>
          <span class="small text-muted">₹${p.price}</span>
        </div>
        <div class="top-sell-bar mt-1" style="width:${Math.round(p.price/maxPrice*100)}%"></div>
      </div>
    </div>
  `).join('');
}

/**
 * Render low stock alerts
 */
function renderLowStock() {
  const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const low = prods.filter(p => p.stock < 10);
  const el = document.getElementById('lowStockList');
  if (!el) return;
  if (low.length === 0) { el.innerHTML = '<p class="text-success">✓ All products are well stocked!</p>'; return; }
  el.innerHTML = low.map(p => `
    <div class="low-stock-card d-flex justify-content-between align-items-center">
      <div>
        <span class="me-2">${p.emoji}</span>
        <strong>${p.name}</strong>
        <span class="ms-2 badge bg-danger">${p.stock} left</span>
      </div>
      <button class="btn btn-sm btn-warning" onclick="restockPrompt(${p.id})">Restock</button>
    </div>
  `).join('');
}

/**
 * Show restock modal
 * @param {number} id
 */
function restockPrompt(id) {
  const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const p = prods.find(x => x.id === id);
  if (!p) return;
  const qty = prompt(`Restock "${p.name}"\nCurrent stock: ${p.stock}\nEnter quantity to add:`);
  if (qty && !isNaN(qty) && parseInt(qty) > 0) {
    p.stock += parseInt(qty);
    localStorage.setItem('sweetbite_products', JSON.stringify(prods));
    showToast(p.name + ' restocked by ' + qty + ' units!', 'success');
    renderLowStock();
  }
}

/**
 * Initialize all Chart.js charts for vendor dashboard
 */
function initCharts() {
  if (typeof Chart === 'undefined') return;

  // Line Chart — Monthly Revenue
  const lineCtx = document.getElementById('revenueChart')?.getContext('2d');
  if (lineCtx) {
    const grad = lineCtx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, 'rgba(255,107,157,0.35)');
    grad.addColorStop(1, 'rgba(255,107,157,0)');
    new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Revenue (₹)',
          data: [12000,19000,15000,25000,22000,30000],
          borderColor: '#FF6B9D',
          backgroundColor: grad,
          tension: 0.45,
          fill: true,
          pointBackgroundColor: '#FF6B9D',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }
        }
      }
    });
  }

  // Doughnut Chart — Category Sales
  const donutCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (donutCtx) {
    new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Ice Cream','Chocolates','Desserts','Cakes','Others'],
        datasets: [{
          data: [30,25,20,15,10],
          backgroundColor: ['#FF6B9D','#3E1F00','#FFD700','#A8E6CF','#E8D5FF'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Bar Chart — Weekly Orders
  const barCtx = document.getElementById('weeklyChart')?.getContext('2d');
  if (barCtx) {
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Orders',
          data: [8,12,7,15,20,25,18],
          backgroundColor: 'rgba(255,107,157,0.75)',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

/* ── VENDOR PRODUCTS PAGE ─────────────────────────────── */

/**
 * Initialize vendor products page
 */
function initVendorProducts() {
  checkSession('vendor');
  renderProductsTable();
  document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
}

/**
 * Render products table
 */
function renderProductsTable() {
  const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = prods.map((p, i) => `
    <tr>
      <td>${i+1}</td>
      <td style="font-size:1.5rem">${p.emoji}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge" style="background:var(--bg-cream);color:var(--secondary)">${categoryNames?.[p.category]||p.category}</span></td>
      <td>₹${p.price}</td>
      <td><del class="text-muted">₹${p.originalPrice}</del></td>
      <td><span class="${p.stock<10?'text-danger fw-bold':''}">${p.stock}</span></td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" ${p.active!==false?'checked':''} 
            onchange="toggleProductStatus(${p.id}, this.checked)">
        </div>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${p.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id},'${p.name.replace(/'/g,"\\'")}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

/**
 * Toggle product active/inactive
 */
function toggleProductStatus(id, active) {
  const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
  const p = prods.find(x => x.id === id);
  if (p) { p.active = active; localStorage.setItem('sweetbite_products', JSON.stringify(prods)); }
  showToast((active ? 'Product activated' : 'Product deactivated'), active ? 'success' : 'info');
}

/**
 * Open add/edit product modal
 * @param {number|null} id
 */
function openEditModal(id = null) {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('productModalTitle').textContent = id ? 'Edit Product' : 'Add New Product';
  document.getElementById('productFormId').value = id || '';

  if (id) {
    const prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
    const p = prods.find(x => x.id === id);
    if (p) {
      document.getElementById('pName').value = p.name;
      document.getElementById('pCategory').value = p.category;
      document.getElementById('pDesc').value = p.desc;
      document.getElementById('pPrice').value = p.price;
      document.getElementById('pOriginalPrice').value = p.originalPrice;
      document.getElementById('pStock').value = p.stock;
      document.getElementById('pEmoji').value = p.emoji;
      document.getElementById('pFeatured').checked = p.featured || false;
    }
  } else {
    document.getElementById('productForm')?.reset();
  }
  new bootstrap.Modal(modal).show();
}

/**
 * Save product (add or edit)
 */
function saveProduct() {
  const id = parseInt(document.getElementById('productFormId')?.value);
  const btn = document.getElementById('saveProductBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
  btn.disabled = true;

  const productData = {
    name: document.getElementById('pName')?.value,
    category: document.getElementById('pCategory')?.value,
    desc: document.getElementById('pDesc')?.value,
    price: parseInt(document.getElementById('pPrice')?.value),
    originalPrice: parseInt(document.getElementById('pOriginalPrice')?.value),
    stock: parseInt(document.getElementById('pStock')?.value),
    emoji: document.getElementById('pEmoji')?.value || '🍰',
    featured: document.getElementById('pFeatured')?.checked,
    rating: 4.5,
    active: true
  };

  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(productData)
  })
  .catch(() => {}) // ignore network errors, we store locally anyway
  .finally(() => {
    let prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
    if (id) {
      const idx = prods.findIndex(p => p.id === id);
      if (idx !== -1) prods[idx] = { ...prods[idx], ...productData };
    } else {
      productData.id = Date.now();
      prods.push(productData);
    }
    localStorage.setItem('sweetbite_products', JSON.stringify(prods));

    btn.innerHTML = originalHTML;
    btn.disabled = false;

    bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
    showToast(id ? 'Product updated!' : 'Product added!', 'success');
    renderProductsTable();
  });
}

/**
 * Delete a product with confirmation
 * @param {number} id
 * @param {string} name
 */
function deleteProduct(id, name) {
  document.getElementById('deleteProductName').textContent = name;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
  document.getElementById('confirmDeleteBtn').onclick = () => {
    let prods = JSON.parse(localStorage.getItem('sweetbite_products')) || products;
    prods = prods.filter(p => p.id !== id);
    localStorage.setItem('sweetbite_products', JSON.stringify(prods));
    modal.hide();
    showToast(name + ' deleted', 'info');
    renderProductsTable();
  };
}

/* ── CUSTOMER DASHBOARD ─────────────────────────────────── */

/**
 * Initialize customer dashboard
 */
function initCustomerDashboard() {
  const session = checkSession('customer');
  if (!session) return;

  document.getElementById('sidebarName') && (document.getElementById('sidebarName').textContent = session.name);
  document.getElementById('sidebarEmail') && (document.getElementById('sidebarEmail').textContent = session.email);

  loadCustomerStats(session);
  renderCustomerOrders(session);
  prefillProfileForm(session);
}

/**
 * Load customer stats
 */
function loadCustomerStats(session) {
  const orders = JSON.parse(localStorage.getItem('sweetbite_orders')) || [];
  const myOrders = orders.filter(o => o.email === session.email);
  const wishlist = JSON.parse(localStorage.getItem('sweetbite_wishlist')) || [];
  const pending = myOrders.filter(o => o.status !== 'Delivered').length;
  const points = Math.floor(Math.random() * 350) + 150;

  if (document.getElementById('cStatOrders'))  countUp(document.getElementById('cStatOrders'), myOrders.length);
  if (document.getElementById('cStatPending')) countUp(document.getElementById('cStatPending'), pending);
  if (document.getElementById('cStatWish'))    countUp(document.getElementById('cStatWish'), wishlist.length);
  if (document.getElementById('cStatPoints'))  countUp(document.getElementById('cStatPoints'), points);
}

/**
 * Render customer orders table
 */
function renderCustomerOrders(session) {
  const orders = JSON.parse(localStorage.getItem('sweetbite_orders')) || [];
  const myOrders = orders.filter(o => o.email === session.email);
  const tbody = document.getElementById('myOrdersBody');
  if (!tbody) return;

  if (myOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No orders yet. <a href="shop.html">Start shopping!</a></td></tr>';
    return;
  }

  const badge = s => {
    const map = { Confirmed:'primary', Delivered:'success', Processing:'warning text-dark', Pending:'danger' };
    return `<span class="badge bg-${map[s]||'secondary'}">${s}</span>`;
  };

  tbody.innerHTML = myOrders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.date}</td>
      <td><small>${o.items?.map(i=>i.emoji+' '+i.name+' ×'+i.qty).join(', ')}</small></td>
      <td><strong>₹${o.total}</strong></td>
      <td>${badge(o.status)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="openTrackModal('${o.id}','${o.status}')">
          <i class="bi bi-geo-alt me-1"></i>Track
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Open delivery tracking modal
 */
function openTrackModal(orderId, status) {
  const steps = ['Order Placed','Confirmed','Out for Delivery','Delivered'];
  const statusMap = { Confirmed:2, Processing:3, Delivered:4, Pending:1 };
  const currentStep = statusMap[status] || 1;

  document.getElementById('trackOrderId').textContent = orderId;
  const tracker = document.getElementById('deliveryTracker');
  if (!tracker) return;

  tracker.innerHTML = steps.map((s, i) => {
    const num = i + 1;
    const isDone = num < currentStep;
    const isActive = num === currentStep;
    const line = i < steps.length - 1
      ? `<div class="track-line-h ${isDone||isActive?'done':''}"></div>` : '';
    return `
      <div class="track-step ${isDone?'done':''} ${isActive?'active':''}">
        <div class="track-circle">${isDone?'✓':isActive?'●':num}</div>
        <div class="track-label">${s}</div>
      </div>
      ${line}
    `;
  }).join('');

  new bootstrap.Modal(document.getElementById('trackModal')).show();
}

/**
 * Pre-fill profile edit form
 */
function prefillProfileForm(session) {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('profileName', session.name);
  set('profileEmail', session.email);
  set('profilePhone', session.phone);
  set('profileAddress', session.address);
}

/**
 * Save profile changes
 */
function saveProfile() {
  const session = getSession();
  if (!session) return;
  session.name = document.getElementById('profileName')?.value || session.name;
  session.phone = document.getElementById('profilePhone')?.value || session.phone;
  session.address = document.getElementById('profileAddress')?.value || session.address;

  setAuthSession(session);
  let users = JSON.parse(localStorage.getItem('sweetbite_users')) || [];
  const idx = users.findIndex(u => u.email === session.email);
  if (idx !== -1) users[idx] = { ...users[idx], ...session };
  localStorage.setItem('sweetbite_users', JSON.stringify(users));

  showToast('Profile updated successfully!', 'success');
}
