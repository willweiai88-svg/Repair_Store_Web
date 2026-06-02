// js/checkout.js
// =============================================================================
//  SIM & MOBILE — Checkout (checkout.html)
// -----------------------------------------------------------------------------
//  Reads the cart saved by shop.js, recognises members via the SAME login keys
//  as the repair booking flow, validates contact details with the shared
//  Validators module, and places the order. Order placement is client-side for
//  now (saved to localStorage 'simShopOrders'); the marked block is the single
//  spot to swap in a real `POST /api/orders` when that route exists.
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const C = window.Cart;
  let cart = C.load();

  const isMember = C.isMember();
  const identity = C.memberIdentity();

  const els = {
    empty: document.getElementById('empty-state'),
    confirm: document.getElementById('confirm-state'),
    grid: document.getElementById('checkout-grid'),
    lineItems: document.getElementById('line-items'),
    badge: document.getElementById('auth-status-badge'),
    guestPrompt: document.getElementById('guest-auth-prompt'),
    firstName: document.getElementById('co-firstname'),
    lastName: document.getElementById('co-lastname'),
    email: document.getElementById('co-email'),
    phone: document.getElementById('co-phone'),
    pickupStore: document.getElementById('pickup-store'),
    deliveryAddress: document.getElementById('delivery-address'),
    pickupFields: document.getElementById('pickup-fields'),
    deliveryFields: document.getElementById('delivery-fields'),
    subtotal: document.getElementById('sum-subtotal'),
    savingsRow: document.getElementById('sum-savings-row'),
    savings: document.getElementById('sum-savings'),
    total: document.getElementById('sum-total'),
    fulfilLabel: document.getElementById('sum-fulfil'),
    placeBtn: document.getElementById('place-order'),
  };

  let fulfilment = 'pickup';

  // --- Member identity pre-fill (mirrors booking.js exactly) ---
  if (isMember) {
    els.badge.textContent = 'Verified Pro Member';
    els.badge.className = 'text-[11px] font-mono uppercase tracking-wider border border-neonGold/40 text-neonGold px-3 py-1.5 rounded-full';
    if (els.guestPrompt) els.guestPrompt.classList.add('hidden');
    if (identity.email) { els.email.value = identity.email; els.email.disabled = true; els.email.classList.add('opacity-60'); }
    if (identity.name) {
      const parts = identity.name.split(' ');
      els.firstName.value = parts[0] || '';
      els.lastName.value = parts.slice(1).join(' ') || '';
    }
  } else if (els.guestPrompt) {
    els.guestPrompt.classList.remove('hidden');
  }

  function showState() {
    els.empty.classList.add('hidden');
    els.confirm.classList.add('hidden');
    els.grid.classList.add('hidden');
    if (cart.length === 0) { els.empty.classList.remove('hidden'); return; }
    els.grid.classList.remove('hidden');
  }

  function renderLines() {
    els.lineItems.innerHTML = cart.map((i) => {
      const unit = isMember ? i.memberPrice : i.price;
      return `
      <div class="flex items-center gap-4 bg-black/30 rounded-xl p-3 border border-white/5">
        <div class="text-2xl w-11 h-11 flex items-center justify-center rounded-lg bg-black/40 border border-white/5">${i.icon || '📦'}</div>
        <div class="flex-grow min-w-0">
          <p class="text-sm font-bold text-white truncate">${i.name}</p>
          <p class="text-[10px] font-mono text-gray-500">${i.brand} · ${i.condition} · $${unit} ea</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-qty="dec" data-id="${i.id}" class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">−</button>
          <span class="w-6 text-center text-sm font-mono">${i.qty}</span>
          <button data-qty="inc" data-id="${i.id}" class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">+</button>
        </div>
        <span class="w-16 text-right text-sm font-bold">$${(unit * i.qty).toFixed(0)}</span>
        <button data-remove="${i.id}" class="text-gray-500 hover:text-red-400 transition text-lg leading-none">×</button>
      </div>`;
    }).join('');
  }

  function renderTotals() {
    const t = C.totals(cart, isMember);
    els.subtotal.textContent = `$${t.subtotal}`;
    els.total.textContent = `$${t.total}`;
    if (isMember && t.savings > 0) {
      els.savingsRow.classList.remove('hidden');
      els.savings.textContent = `-$${t.savings}`;
    } else {
      els.savingsRow.classList.add('hidden');
    }
    els.fulfilLabel.textContent = fulfilment === 'pickup' ? 'Pickup — Free' : 'Delivery — Free';
  }

  function refresh() {
    showState();
    if (cart.length === 0) return;
    renderLines();
    renderTotals();
  }

  // --- Line item qty / remove (event delegation) ---
  els.lineItems.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-qty]');
    const rem = e.target.closest('[data-remove]');
    if (inc) {
      const item = cart.find((i) => i.id === inc.dataset.id);
      const delta = inc.dataset.qty === 'inc' ? 1 : -1;
      cart = C.setQty(cart, item.id, item.qty + delta);
    } else if (rem) {
      cart = C.removeItem(cart, rem.dataset.remove);
    } else {
      return;
    }
    C.save(cart);
    refresh();
  });

  // --- Fulfilment toggle ---
  document.querySelectorAll('.fulfil-btn').forEach((b) => {
    b.addEventListener('click', () => {
      fulfilment = b.dataset.fulfil;
      document.querySelectorAll('.fulfil-btn').forEach((x) => x.classList.remove('fulfil-active'));
      b.classList.add('fulfil-active');
      els.pickupFields.classList.toggle('hidden', fulfilment !== 'pickup');
      els.deliveryFields.classList.toggle('hidden', fulfilment !== 'delivery');
      renderTotals();
    });
  });

  // --- Validation helpers ---
  function clearErrors() {
    document.querySelectorAll('[data-err]').forEach((p) => p.classList.add('hidden'));
    [els.firstName, els.lastName, els.email, els.phone].forEach((i) => i.classList.remove('field-error'));
  }
  function showError(field, msg) {
    const node = document.querySelector(`[data-err="${field}"]`);
    if (node) { node.textContent = msg; node.classList.remove('hidden'); }
    const input = { firstName: els.firstName, lastName: els.lastName, email: els.email, phone: els.phone }[field];
    if (input) input.classList.add('field-error');
  }

  // --- Place order ---
  els.placeBtn.addEventListener('click', async () => {
    clearErrors();

    const customer = {
      firstName: els.firstName.value.trim(),
      lastName: els.lastName.value.trim(),
      email: els.email.value.trim(),
      phone: els.phone.value.trim(),
    };

    // Reuse the SAME tested rules the repair flow should use.
    const V = window.Validators;
    const errors = {};
    if (!V.isValidName(customer.firstName)) errors.firstName = 'First name must be 2–30 letters.';
    if (!V.isValidName(customer.lastName)) errors.lastName = 'Last name must be 2–30 letters.';
    if (!V.isValidEmail(customer.email)) errors.email = 'Enter a valid email address.';
    if (!V.isValidAUPhone(customer.phone)) errors.phone = 'Enter a valid Australian phone number.';

    let fulfilDetail = '';
    if (fulfilment === 'pickup') {
      fulfilDetail = els.pickupStore.value;
      if (!fulfilDetail) errors.fulfilment = 'Please select a collection store.';
    } else {
      fulfilDetail = els.deliveryAddress.value.trim();
      if (!V.isWithinLength(fulfilDetail, 10, 300)) errors.fulfilment = 'Please enter a full delivery address.';
    }

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, m]) => showError(f, m));
      return;
    }

    const t = C.totals(cart, isMember);
    const order = {
      orderId: 'SM-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      isMember,
      customer: { name: `${customer.firstName} ${customer.lastName}`, email: customer.email, phone: customer.phone },
      fulfilment: { method: fulfilment, detail: fulfilDetail },
      items: cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty, unitPrice: isMember ? i.memberPrice : i.price })),
      subtotal: t.subtotal,
      savings: t.savings,
      total: t.total,
    };

    els.placeBtn.disabled = true;
    els.placeBtn.textContent = 'PROCESSING…';

    // =========================================================================
    // ORDER PLACEMENT — client-side for now.
    // When an orders endpoint exists, replace the block below with:
    //   await fetch(`${window.CONFIG.API_BASE_URL}/api/orders`, {
    //     method: 'POST', headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(order) });
    // (Deliberately NOT /api/bookings — product orders must not pollute the
    //  repair bookings collection that feeds analytics and the review gate.)
    // =========================================================================
    try {
      const history = JSON.parse(localStorage.getItem('simShopOrders') || '[]');
      history.unshift(order);
      localStorage.setItem('simShopOrders', JSON.stringify(history));
    } catch (e) { /* ignore storage errors */ }

    C.clear();
    cart = [];

    document.getElementById('confirm-id').textContent = order.orderId;
    document.getElementById('confirm-email').textContent = order.customer.email;
    document.getElementById('confirm-total').textContent = `$${order.total}`;
    els.grid.classList.add('hidden');
    els.empty.classList.add('hidden');
    els.confirm.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  refresh();
});
