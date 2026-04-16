/* ============================================================
   payment.js — SweetBite Checkout & Payment Logic
   ============================================================ */

/** Current checkout step: 1, 2, or 3 */
let currentStep = 1;
let deliveryData = {};

/**
 * Initialize checkout page
 */
function initCheckout() {
  loadDeliveryFromSession();
  showStep(1);
  setupCardPreview();
  setupUPIVerify();
  prefillSummary();
}

/**
 * Pre-fill delivery form from session storage
 */
function loadDeliveryFromSession() {
  const session = JSON.parse(sessionStorage.getItem('sweetbite_session'));
  if (!session) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('delivName', session.name);
  set('delivEmail', session.email);
  set('delivPhone', session.phone);
  set('delivAddress', session.address);
  set('delivCity', session.city);
  set('delivState', session.state);
}

/**
 * Show a specific checkout step
 * @param {number} step
 */
function showStep(step) {
  currentStep = step;
  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById('step' + i);
    if (panel) panel.classList.toggle('d-none', i !== step);
  }
  updateStepUI(step);
}

/**
 * Update step indicator UI
 * @param {number} active
 */
function updateStepUI(active) {
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById('stepCircle' + i);
    const label  = document.getElementById('stepLabel' + i);
    const item   = document.getElementById('stepItem' + i);
    if (!circle) continue;
    item?.classList.remove('active', 'done');
    if (i < active) item?.classList.add('done');
    else if (i === active) item?.classList.add('active');

    const line = document.getElementById('stepLine' + i);
    if (line) line.classList.toggle('done', i < active);
  }
}

/**
 * Proceed from step 1 (delivery) to step 2
 */
function nextToPayment() {
  const fields = ['delivName','delivEmail','delivPhone','delivAddress','delivCity','delivState','delivPIN'];
  let valid = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value.trim()) {
      el.classList.add('is-invalid');
      valid = false;
    } else el?.classList.remove('is-invalid');
  });

  if (!valid) { showToast('Please fill all delivery fields', 'warning'); return; }

  deliveryData = {
    name: document.getElementById('delivName')?.value,
    email: document.getElementById('delivEmail')?.value,
    phone: document.getElementById('delivPhone')?.value,
    address: document.getElementById('delivAddress')?.value,
    city: document.getElementById('delivCity')?.value,
    state: document.getElementById('delivState')?.value,
    pin: document.getElementById('delivPIN')?.value
  };

  if (document.getElementById('saveAddress')?.checked) {
    const session = getSession();
    if (session) {
      Object.assign(session, deliveryData);
      setAuthSession(session);
      let users = JSON.parse(localStorage.getItem('sweetbite_users')) || [];
      const idx = users.findIndex(u => u.email === session.email);
      if (idx !== -1) { Object.assign(users[idx], deliveryData); localStorage.setItem('sweetbite_users', JSON.stringify(users)); }
    }
  }

  showStep(2);
}

/**
 * Go back to a previous step
 * @param {number} step
 */
function goToStep(step) { showStep(step); }

/**
 * Setup live credit card preview
 */
function setupCardPreview() {
  const numInput = document.getElementById('cardNumber');
  if (numInput) {
    numInput.addEventListener('input', function() {
      let val = this.value.replace(/\D/g, '').slice(0, 16);
      this.value = val.replace(/(.{4})/g, '$1 ').trim();
      const display = document.getElementById('previewNumber');
      if (display) display.textContent = this.value || '•••• •••• •••• ••••';

      const typeEl = document.getElementById('previewType');
      if (typeEl) {
        const first = val[0];
        if (first === '4') typeEl.textContent = 'VISA';
        else if (first === '5') typeEl.textContent = 'MASTERCARD';
        else if (first === '3') typeEl.textContent = 'AMEX';
        else typeEl.textContent = '';
      }
    });
  }

  const nameInput = document.getElementById('cardName');
  if (nameInput) {
    nameInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
      const el = document.getElementById('previewName');
      if (el) el.textContent = this.value || 'CARDHOLDER NAME';
    });
  }

  const expInput = document.getElementById('cardExpiry');
  if (expInput) {
    expInput.addEventListener('input', function() {
      let val = this.value.replace(/\D/g, '');
      if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
      this.value = val;
      const el = document.getElementById('previewExpiry');
      if (el) el.textContent = this.value || 'MM/YY';
    });
  }
}

/**
 * Setup UPI verify button
 */
function setupUPIVerify() {
  const btn = document.getElementById('verifyUPI');
  if (!btn) return;
  btn.addEventListener('click', function() {
    const upiInput = document.getElementById('upiId');
    if (!upiInput) return;
    const val = upiInput.value.trim();
    if (!val.includes('@') || val.split('@').length !== 2) {
      showToast('Invalid UPI ID. Must contain exactly one @', 'danger');
      upiInput.classList.add('is-invalid');
      return;
    }
    upiInput.classList.remove('is-invalid');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Verifying...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '✓ UPI Verified';
      btn.classList.replace('btn-outline-primary', 'btn-success');
      showToast('UPI ID verified successfully ✓', 'success');
    }, 1500);
  });
}

/**
 * Prefill order summary on checkout page
 */
function prefillSummary() {
  const cart = JSON.parse(localStorage.getItem('sweetbite_cart')) || [];
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= 500 ? 0 : 50;
  const gst = Math.round(subtotal * 0.18);
  const coupon = JSON.parse(sessionStorage.getItem('sweetbite_coupon') || 'null');
  const discount = coupon?.type === 'percent' ? Math.round(subtotal * coupon.pct / 100) : 0;
  const total = subtotal + delivery + gst - discount;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('ckSubtotal', '₹' + subtotal);
  set('ckDelivery', delivery === 0 ? 'FREE' : '₹' + delivery);
  set('ckGST', '₹' + gst);
  set('ckDiscount', discount > 0 ? '−₹' + discount : '₹0');
  set('ckTotal', '₹' + total);
  set('ckTotalBtn', '₹' + total);
  set('codTotal', total + 30);

  const summaryEl = document.getElementById('ckItems');
  if (summaryEl) {
    summaryEl.innerHTML = cart.map(i =>
      `<div class="d-flex justify-content-between small mb-1">
        <span>${i.emoji} ${i.name} × ${i.qty}</span>
        <span>₹${i.price * i.qty}</span>
      </div>`
    ).join('');
  }
}

/**
 * Process payment — show spinner, place order
 */
function processPayment() {
  const activeTab = document.querySelector('#paymentTabs .nav-link.active');
  const method = activeTab?.dataset.method || 'Card';

  if (method === 'COD') {
    const confirm = document.getElementById('codConfirm');
    if (!confirm?.checked) { showToast('Please confirm COD delivery', 'warning'); return; }
  }

  if (method === 'Card') {
    const num = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
    if (!num || num.length < 16) { showToast('Please enter valid card number', 'warning'); return; }
  }

  setSpinner(true);
  setTimeout(() => {
    setSpinner(false);
    placeOrder(deliveryData, method);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', initCheckout);
