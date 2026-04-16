/* ============================================================
   auth.js — SweetBite Authentication & Data Management
   Uses: localStorage, sessionStorage, fetch() AJAX simulation
   ============================================================ */

function getStoredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem('sweetbite_users'));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getLastRegisteredUser() {
  try {
    const user = localStorage.getItem('sweetbite_last_registered_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function setAuthSession(user) {
  const serialized = JSON.stringify(user);
  try {
    sessionStorage.setItem('sweetbite_session', serialized);
  } catch {}
  try {
    localStorage.setItem('sweetbite_session', serialized);
  } catch {}
}

function clearAuthSession() {
  try {
    sessionStorage.removeItem('sweetbite_session');
  } catch {}
  try {
    localStorage.removeItem('sweetbite_session');
  } catch {}
}

/**
 * Register a new user via simulated AJAX POST
 * @param {Object} userData - User registration data
 * @param {HTMLElement} btn - Submit button reference
 */
function registerUser(userData, btn) {
  userData.email = normalizeEmail(userData.email);
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
  btn.disabled = true;

  const users = getStoredUsers();
  const exists = users.find(u => normalizeEmail(u.email) === userData.email);
  if (exists) {
    showToast('Email already registered. Please login.', 'warning');
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    return;
  }

  users.push(userData);
  localStorage.setItem('sweetbite_users', JSON.stringify(users));
  localStorage.setItem('sweetbite_last_registered_user', JSON.stringify(userData));
  showToast('Registration successful! Please login to continue.', 'success');
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    window.location.href = 'login.html';
  }, 1200);
  /* Legacy fetch path disabled.
  fetch('https://jsonplaceholder.typicode.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  .then(res => res.json())
  .then(() => {
    let users = getStoredUsers();
    const exists = users.find(u => normalizeEmail(u.email) === userData.email);
    if (exists) {
      showToast('Email already registered. Please login.', 'warning');
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      return;
    }
    users.push(userData);
    localStorage.setItem('sweetbite_users', JSON.stringify(users));
    showToast('Registration successful! Welcome to SweetBite 🎉', 'success');
    setTimeout(() => window.location.href = 'product-list.html', 1500);
  })
  .catch(() => {
    // Fallback: still save to localStorage even if fetch fails
    let users = getStoredUsers();
    const exists = users.find(u => normalizeEmail(u.email) === userData.email);
    if (exists) {
      showToast('Email already registered. Please login.', 'warning');
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      return;
    }
    users.push(userData);
    localStorage.setItem('sweetbite_users', JSON.stringify(users));
    showToast('Registration successful! Welcome to SweetBite 🎉', 'success');
    setTimeout(() => window.location.href = 'product-list.html', 1500);
  })
  .finally(() => {
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }, 2000);
  });
  */
}

/**
 * Login an existing user
 * @param {string} email
 * @param {string} password
 * @param {string} role - 'customer' or 'vendor'
 */
function loginUser(email, password, role) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const users = getStoredUsers();
  let user = users.find(u =>
    String(u.email || '').trim().toLowerCase() === normalizedEmail &&
    String(u.password || '').trim() === normalizedPassword
  );
  if (!user) {
    const lastRegisteredUser = getLastRegisteredUser();
    if (
      lastRegisteredUser &&
      normalizeEmail(lastRegisteredUser.email) === normalizedEmail &&
      String(lastRegisteredUser.password || '').trim() === normalizedPassword
    ) {
      user = lastRegisteredUser;
    }
  }
  if (user) {
    setAuthSession(user);
    showToast('Welcome back, ' + user.name + '! 🎉', 'success');
    setTimeout(() => {
      window.location.href = user.role === 'vendor' ? 'vendor-dashboard.html' : 'customer-dashboard.html';
    }, 800);
  } else {
    showToast('Invalid email or password', 'danger');
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
      alertEl.classList.remove('d-none');
      setTimeout(() => alertEl.classList.add('d-none'), 3000);
    }
  }
}

/**
 * Check session — redirect to login if not authenticated
 * @param {string} requiredRole - 'customer' or 'vendor'
 * @returns {Object} user session object
 */
function checkSession(requiredRole) {
  const session = getSession();
  if (!session || session.role !== requiredRole) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

/**
 * Get current session user (without redirect)
 * @returns {Object|null}
 */
function getSession() {
  try {
    const session = sessionStorage.getItem('sweetbite_session') || localStorage.getItem('sweetbite_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

/**
 * Logout user and clear session
 */
function logoutUser() {
  clearAuthSession();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = 'login.html', 800);
}

// ── CART FUNCTIONS ────────────────────────────────────────────

/**
 * Add a product to the cart
 * @param {Object} product
 */
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  localStorage.setItem('sweetbite_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(product.name + ' added to cart 🛒', 'success');
}

/**
 * Remove a product from cart by ID
 * @param {number} productId
 */
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('sweetbite_cart', JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Update quantity of a cart item
 * @param {number} productId
 * @param {number} qty
 */
function updateCartQty(productId, qty) {
  let cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const item = cart.find(i => i.id === productId);
  if (item) {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    item.qty = qty;
  }
  localStorage.setItem('sweetbite_cart', JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Update all cart badge elements on the page
 */
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'inline' : 'none';
  });
}

/**
 * Get subtotal of all cart items
 * @returns {number}
 */
function getCartTotal() {
  const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// ── ORDER PLACEMENT ───────────────────────────────────────────

/**
 * Place an order — saves to localStorage, clears cart, redirects
 * @param {Object} address - Delivery address
 * @param {string} paymentMethod
 */
function placeOrder(address, paymentMethod) {
  const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const session = JSON.parse(sessionStorage.getItem('sweetbite_session'));
  const subtotal = getCartTotal();
  const delivery = subtotal >= 500 ? 0 : 50;
  const gst = Math.round(subtotal * 0.18);
  const coupon = JSON.parse(sessionStorage.getItem('sweetbite_coupon') || 'null');
  const discount = coupon ? Math.round(subtotal * (coupon.pct / 100)) : 0;
  const total = subtotal + delivery + gst - discount;

  const order = {
    id: '#SB' + Date.now(),
    customer: session?.name || 'Guest',
    email: session?.email || '',
    items: cart,
    subtotal,
    delivery,
    gst,
    discount,
    total,
    address,
    paymentMethod,
    status: 'Confirmed',
    date: new Date().toLocaleDateString('en-IN'),
    timestamp: Date.now()
  };

  let orders = JSON.parse(localStorage.getItem('sweetbite_orders')) || [];
  orders.push(order);
  localStorage.setItem('sweetbite_orders', JSON.stringify(orders));
  localStorage.removeItem('sweetbite_cart');
  sessionStorage.removeItem('sweetbite_coupon');
  sessionStorage.setItem('sweetbite_last_order', JSON.stringify(order));
  window.location.href = 'order-confirmation.html';
}

// ── WISHLIST ──────────────────────────────────────────────────

/**
 * Toggle wishlist for a product
 * @param {number} productId
 * @param {HTMLElement} btn - wishlist button
 */
function toggleWishlist(productId, btn) {
  let wishlist = JSON.parse(localStorage.getItem('sweetbite_wishlist')) || [];
  const idx = wishlist.indexOf(productId);
  if (idx === -1) {
    wishlist.push(productId);
    if (btn) { btn.innerHTML = '<i class="bi bi-heart-fill" style="color:#e53935"></i>'; }
    showToast('Added to wishlist ❤️', 'success');
  } else {
    wishlist.splice(idx, 1);
    if (btn) { btn.innerHTML = '<i class="bi bi-heart"></i>'; }
    showToast('Removed from wishlist', 'info');
  }
  localStorage.setItem('sweetbite_wishlist', JSON.stringify(wishlist));
}

// ── TOAST NOTIFICATION ────────────────────────────────────────

/**
 * Show a toast notification
 * @param {string} message
 * @param {string} type - success | danger | warning | info
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `<i class="bi bi-${getToastIcon(type)} me-2"></i>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/** Get Bootstrap icon name for toast type */
function getToastIcon(type) {
  const map = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
  return map[type] || 'bell-fill';
}

// ── SHOW SPINNER OVERLAY ──────────────────────────────────────

/**
 * Show/hide the fullscreen spinner overlay
 * @param {boolean} visible
 */
function setSpinner(visible) {
  let overlay = document.getElementById('spinnerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'spinnerOverlay';
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = `
      <div class="spinner-border" role="status"></div>
      <p class="mt-3" style="font-family:Poppins;color:var(--secondary);font-weight:600">Please wait...</p>
    `;
    document.body.appendChild(overlay);
  }
  if (visible) overlay.classList.add('show');
  else overlay.classList.remove('show');
}

// ── EXPORT CSV ────────────────────────────────────────────────

/**
 * Export an array of objects to a CSV file download
 * @param {Array} data
 * @param {string} filename
 */
function exportToCSV(data, filename) {
  if (!data || !data.length) return showToast('No data to export', 'warning');
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('CSV exported successfully!', 'success');
}

// ── COUNT UP ANIMATION ────────────────────────────────────────

/**
 * Animate a number counting up from 0
 * @param {HTMLElement} el
 * @param {number} target
 * @param {string} prefix - e.g. '₹'
 * @param {number} duration ms
 */
function countUp(el, target, prefix = '', duration = 1500) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.round(eased * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── STAR RATING RENDER ────────────────────────────────────────

/**
 * Generate star rating HTML
 * @param {number} rating - 0 to 5
 * @returns {string} HTML
 */
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<i class="bi bi-star-fill stars"></i>';
    else if (rating >= i - 0.5) html += '<i class="bi bi-star-half stars"></i>';
    else html += '<i class="bi bi-star stars" style="color:#ccc"></i>';
  }
  return html;
}

// ── INIT CART BADGE ON LOAD ───────────────────────────────────
document.addEventListener('DOMContentLoaded', updateCartBadge);
