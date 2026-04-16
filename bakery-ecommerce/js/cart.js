/* ============================================================
   cart.js — SweetBite Cart Page Logic
   ============================================================ */

/** Active coupon state */
let activeCoupon = null;

/** Valid coupons map */
const COUPONS = {
  'SWEET10':  { pct: 10, label: '10% off', type: 'percent' },
  'CHOCO20':  { pct: 20, label: '20% off', type: 'percent' },
  'FREESHIP': { pct: 0,  label: 'Free Delivery', type: 'freeship' }
};

/**
 * Initialize cart page on DOM load
 */
function initCart() {
  renderCart();
  document.getElementById('applyCoupon')?.addEventListener('click', applyCoupon);
  document.getElementById('couponInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyCoupon();
  });
}

/**
 * Render the full cart table and summary
 */
function renderCart() {
  const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const container = document.getElementById('cartContainer');
  const emptyEl   = document.getElementById('cartEmpty');
  const tableEl   = document.getElementById('cartTable');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cart.length === 0) {
    if (emptyEl)   emptyEl.classList.remove('d-none');
    if (tableEl)   tableEl.classList.add('d-none');
    if (checkoutBtn) checkoutBtn.disabled = true;
    updateSummary(cart);
    return;
  }

  if (emptyEl)   emptyEl.classList.add('d-none');
  if (tableEl)   tableEl.classList.remove('d-none');
  if (checkoutBtn) checkoutBtn.disabled = false;

  const tbody = document.getElementById('cartBody');
  if (!tbody) return;
  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <span style="font-size:1.8rem">${item.emoji}</span>
          <div>
            <div class="fw-bold">${item.name}</div>
            <small class="text-muted">${categoryNames?.[item.category] || item.category}</small>
          </div>
        </div>
      </td>
      <td class="align-middle fw-bold">₹${item.price}</td>
      <td class="align-middle">
        <div class="d-flex align-items-center gap-2">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty - 1})">−</button>
          <input type="number" class="qty-input form-control" value="${item.qty}" min="1"
            onchange="changeQty(${item.id}, parseInt(this.value))" style="width:54px">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.qty + 1})">+</button>
        </div>
      </td>
      <td class="align-middle fw-bold text-primary-sweet">₹${item.price * item.qty}</td>
      <td class="align-middle">
        <button class="btn btn-sm btn-outline-danger rounded-circle" style="width:34px;height:34px;padding:0"
          onclick="confirmRemove(${item.id}, '${item.name.replace(/'/g, "\\'")}')">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>
    </tr>
  `).join('');

  updateSummary(cart);
}

/**
 * Change quantity of a cart item and re-render
 * @param {number} id
 * @param {number} newQty
 */
function changeQty(id, newQty) {
  if (newQty <= 0) {
    const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
    const item = cart.find(i => i.id === id);
    if (item) confirmRemove(id, item.name);
    return;
  }
  updateCartQty(id, newQty);
  renderCart();
}

/**
 * Confirm and remove a cart item
 * @param {number} id
 * @param {string} name
 */
function confirmRemove(id, name) {
  if (confirm(`Remove "${name}" from cart?`)) {
    removeFromCart(id);
    renderCart();
  }
}

/**
 * Update order summary totals
 * @param {Array} cart
 */
function updateSummary(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const isFreeship = activeCoupon?.type === 'freeship';
  const delivery = (subtotal >= 500 || isFreeship) ? 0 : 50;
  const gst = Math.round(subtotal * 0.18);
  const discount = activeCoupon?.type === 'percent'
    ? Math.round(subtotal * activeCoupon.pct / 100) : 0;
  const total = subtotal + delivery + gst - discount;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('summarySubtotal', '₹' + subtotal);
  set('summaryGST', '₹' + gst);
  set('summaryTotal', '₹' + total);

  const delivEl = document.getElementById('summaryDelivery');
  if (delivEl) {
    if (delivery === 0) delivEl.innerHTML = '<span style="color:#2e7d32;font-weight:700">FREE 🎉</span>';
    else delivEl.textContent = '₹' + delivery;
  }

  const discEl = document.getElementById('summaryDiscount');
  if (discEl) {
    if (discount > 0) {
      discEl.textContent = '−₹' + discount;
      discEl.parentElement?.classList.remove('d-none');
    } else {
      discEl.parentElement?.classList.add('d-none');
    }
  }

  // Store for checkout
  sessionStorage.setItem('sweetbite_coupon', JSON.stringify(activeCoupon));
}

/**
 * Apply coupon code
 */
function applyCoupon() {
  const input = document.getElementById('couponInput');
  const code = input?.value.trim().toUpperCase();
  const feedbackEl = document.getElementById('couponFeedback');

  if (!code) return;

  if (COUPONS[code]) {
    activeCoupon = COUPONS[code];
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="badge bg-success fs-6">✓ ${COUPONS[code].label} applied!</span>`;
    }
    showToast('Coupon applied: ' + COUPONS[code].label + ' 🎉', 'success');
    renderCart();
  } else {
    activeCoupon = null;
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="text-danger fw-bold">✗ Invalid coupon code</span>`;
    }
    input?.classList.add('shake');
    setTimeout(() => input?.classList.remove('shake'), 500);
    showToast('Invalid coupon code', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', initCart);
