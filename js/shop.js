// js/shop.js
// =============================================================================
//  SIM & MOBILE — Retail Showcase (shop.html)
// -----------------------------------------------------------------------------
//  Client-side product catalogue with a fully reactive filter engine:
//  text search, category + brand multi-select, condition, price ceiling, sort,
//  and a member-pricing view toggle. The backend currently exposes no
//  /api/products route, so the catalogue lives here; CATALOGUE is the only line
//  to swap for a `fetch()` when that endpoint ships — the filter engine is
//  written against plain objects and stays untouched.
// =============================================================================

const CATALOGUE = [
  { id: 'p01', name: 'Titanium Bumper Case', brand: 'Apple', category: 'Cases', condition: 'New', price: 59, memberPrice: 49, rating: 5, stock: 24, badge: 'Best Seller', icon: '🛡️', blurb: 'Aerospace-grade frame with MagSafe array alignment.' },
  { id: 'p02', name: 'Silicone Grip Case', brand: 'Samsung', category: 'Cases', condition: 'New', price: 39, memberPrice: 32, rating: 4, stock: 40, badge: '', icon: '📱', blurb: 'Soft-touch shell with raised camera lip protection.' },
  { id: 'p03', name: 'Sapphire Screen Protector', brand: 'Universal', category: 'Screen Protectors', condition: 'New', price: 29, memberPrice: 22, rating: 5, stock: 120, badge: 'Scratch-Proof', icon: '💎', blurb: '9H hardness tempered layer with oleophobic coating.' },
  { id: 'p04', name: 'Privacy Tempered Glass', brand: 'Belkin', category: 'Screen Protectors', condition: 'New', price: 34, memberPrice: 28, rating: 4, stock: 75, badge: '', icon: '🕶️', blurb: 'Anti-spy filter limits viewing angle to 30°.' },
  { id: 'p05', name: '65W GaN Fast Charger', brand: 'Anker', category: 'Chargers & Cables', condition: 'New', price: 79, memberPrice: 65, rating: 5, stock: 33, badge: 'Fast Charge', icon: '⚡', blurb: 'Dual USB-C gallium-nitride brick, laptop-capable.' },
  { id: 'p06', name: 'Braided USB-C Cable 2m', brand: 'Belkin', category: 'Chargers & Cables', condition: 'New', price: 24, memberPrice: 19, rating: 4, stock: 200, badge: '', icon: '🔌', blurb: 'Kevlar-reinforced 100W e-marker data cable.' },
  { id: 'p07', name: 'MagSafe Power Bank 10K', brand: 'Anker', category: 'Power Banks', condition: 'New', price: 99, memberPrice: 85, rating: 5, stock: 18, badge: 'Wireless', icon: '🔋', blurb: '10,000mAh magnetic pack with pass-through charging.' },
  { id: 'p08', name: 'Slim Pocket Bank 5K', brand: 'Universal', category: 'Power Banks', condition: 'New', price: 49, memberPrice: 41, rating: 4, stock: 60, badge: '', icon: '🪫', blurb: 'Credit-card profile 5,000mAh USB-C top-up cell.' },
  { id: 'p09', name: 'ANC Wireless Earbuds', brand: 'Samsung', category: 'Audio', condition: 'New', price: 149, memberPrice: 129, rating: 5, stock: 27, badge: 'Noise Cancel', icon: '🎧', blurb: 'Adaptive active noise cancellation, 30h case life.' },
  { id: 'p10', name: 'Studio Over-Ear Headphones', brand: 'Apple', category: 'Audio', condition: 'New', price: 399, memberPrice: 359, rating: 5, stock: 9, badge: 'Premium', icon: '🎼', blurb: 'Spatial audio with dynamic head tracking.' },
  { id: 'p11', name: 'iPhone 15 Pro (Refurb)', brand: 'Apple', category: 'Refurbished Phones', condition: 'Refurbished', price: 1099, memberPrice: 999, rating: 5, stock: 6, badge: 'Certified', icon: '📲', blurb: 'Grade-A refurbished, new battery, 12-month warranty.' },
  { id: 'p12', name: 'Galaxy S24 (Refurb)', brand: 'Samsung', category: 'Refurbished Phones', condition: 'Refurbished', price: 849, memberPrice: 769, rating: 4, stock: 8, badge: 'Certified', icon: '📲', blurb: 'Fully tested, unlocked, 90-point inspection passed.' },
  { id: 'p13', name: 'Pixel 8 (Refurb)', brand: 'Google', category: 'Refurbished Phones', condition: 'Refurbished', price: 649, memberPrice: 589, rating: 4, stock: 5, badge: '', icon: '📲', blurb: 'Refurbished flagship with pristine OLED panel.' },
  { id: 'p14', name: 'OLED Screen Assembly', brand: 'Apple', category: 'Parts', condition: 'New', price: 219, memberPrice: 189, rating: 4, stock: 15, badge: 'Genuine-Grade', icon: '🧩', blurb: 'Replacement display module with adhesive kit.' },
  { id: 'p15', name: 'Lithium Battery Cell', brand: 'Samsung', category: 'Parts', condition: 'New', price: 69, memberPrice: 55, rating: 4, stock: 50, badge: '', icon: '🔧', blurb: 'OEM-spec replacement cell with install gasket.' },
  { id: 'p16', name: 'Charging Port Flex', brand: 'Google', category: 'Parts', condition: 'New', price: 45, memberPrice: 38, rating: 3, stock: 30, badge: '', icon: '🪛', blurb: 'USB-C daughterboard flex with microphone module.' },
];

// --- Pure filter engine (no DOM) ------------------------------------------
// Exposed on window for reuse/testing; takes a list + a state object and
// returns a new filtered, sorted list.
function applyFilters(products, state) {
  const q = (state.search || '').trim().toLowerCase();
  let out = products.filter((p) => {
    if (q && !(`${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q))) return false;
    if (state.categories.length && !state.categories.includes(p.category)) return false;
    if (state.brands.length && !state.brands.includes(p.brand)) return false;
    if (state.condition !== 'All' && p.condition !== state.condition) return false;
    const effective = state.memberView ? p.memberPrice : p.price;
    if (effective > state.maxPrice) return false;
    return true;
  });

  const priceOf = (p) => (state.memberView ? p.memberPrice : p.price);
  const sorters = {
    'price-asc': (a, b) => priceOf(a) - priceOf(b),
    'price-desc': (a, b) => priceOf(b) - priceOf(a),
    'rating-desc': (a, b) => b.rating - a.rating,
    'name-asc': (a, b) => a.name.localeCompare(b.name),
  };
  if (sorters[state.sort]) out = out.slice().sort(sorters[state.sort]);
  return out;
}
if (typeof window !== 'undefined') window.applyFilters = applyFilters;
if (typeof module !== 'undefined' && module.exports) module.exports = { applyFilters, CATALOGUE };

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  const CATEGORIES = [...new Set(CATALOGUE.map((p) => p.category))];
  const BRANDS = [...new Set(CATALOGUE.map((p) => p.brand))].sort();
  const PRICE_CEIL = Math.ceil(Math.max(...CATALOGUE.map((p) => p.price)) / 100) * 100;

  const state = {
    search: '',
    categories: [],
    brands: [],
    condition: 'All',
    maxPrice: PRICE_CEIL,
    sort: 'rating-desc',
    memberView: false,
  };

  const grid = document.getElementById('product-grid');
  const countEl = document.getElementById('result-count');
  const priceLabel = document.getElementById('price-label');
  const priceSlider = document.getElementById('price-slider');
  const searchInput = document.getElementById('search-input');

  // Build category + brand filter chips
  function chip(label, group) {
    return `<button data-group="${group}" data-value="${label}"
      class="filter-chip text-xs font-mono px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:border-neonBlue/60 hover:text-white transition">${label}</button>`;
  }
  document.getElementById('category-chips').innerHTML = CATEGORIES.map((c) => chip(c, 'categories')).join('');
  document.getElementById('brand-chips').innerHTML = BRANDS.map((b) => chip(b, 'brands')).join('');

  priceSlider.min = 0;
  priceSlider.max = PRICE_CEIL;
  priceSlider.value = PRICE_CEIL;
  priceSlider.step = 10;

  function render() {
    const results = applyFilters(CATALOGUE, state);
    countEl.textContent = `${results.length} ${results.length === 1 ? 'product' : 'products'}`;

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-20">
          <div class="text-5xl mb-4 opacity-40">🛰️</div>
          <p class="text-gray-400 font-mono">No products match the current filter matrix.</p>
          <button id="reset-empty" class="mt-4 text-neonBlue font-mono text-sm hover:underline">Reset filters</button>
        </div>`;
      document.getElementById('reset-empty').addEventListener('click', resetAll);
      return;
    }

    grid.innerHTML = results.map((p) => {
      const showMember = state.memberView;
      const big = showMember ? p.memberPrice : p.price;
      const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating);
      const lowStock = p.stock <= 8;
      return `
      <article class="glass-panel rounded-2xl p-5 flex flex-col hover-glow transition group relative overflow-hidden">
        ${p.badge ? `<span class="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-wider bg-neonGold/15 text-neonGold border border-neonGold/30 px-2 py-0.5 rounded-full">${p.badge}</span>` : ''}
        <div class="text-4xl mb-4 w-16 h-16 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 group-hover:border-neonBlue/40 transition">${p.icon}</div>
        <p class="text-[10px] font-mono uppercase tracking-widest text-gray-500">${p.brand} · ${p.condition}</p>
        <h3 class="text-lg font-bold text-white mt-1 mb-1 leading-tight">${p.name}</h3>
        <p class="text-xs text-gray-400 leading-relaxed flex-grow">${p.blurb}</p>
        <div class="flex items-center justify-between mt-4 mb-3">
          <span class="text-neonGold text-sm tracking-tighter" aria-label="${p.rating} out of 5">${stars}</span>
          <span class="text-[10px] font-mono ${lowStock ? 'text-red-400' : 'text-gray-500'}">${lowStock ? 'Low stock' : 'In stock'} · ${p.stock}</span>
        </div>
        <div class="flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <p class="text-2xl font-black text-white ${showMember ? 'glow-gold' : ''}">$${big}</p>
            ${showMember ? `<p class="text-[10px] text-gray-500 line-through font-mono">RRP $${p.price}</p>` : `<p class="text-[10px] text-neonGold font-mono">Member $${p.memberPrice}</p>`}
          </div>
          <button data-add="${p.id}" class="bg-neonBlue text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-white transition shadow-[0_0_15px_rgba(0,243,255,0.3)] uppercase tracking-wide">Add</button>
        </div>
      </article>`;
    }).join('');
  }

  function syncChipStyles() {
    document.querySelectorAll('.filter-chip').forEach((c) => {
      const active = state[c.dataset.group].includes(c.dataset.value);
      c.className = active
        ? 'filter-chip text-xs font-mono px-3 py-1.5 rounded-full border border-neonBlue bg-neonBlue/15 text-neonBlue transition shadow-[0_0_10px_rgba(0,243,255,0.2)]'
        : 'filter-chip text-xs font-mono px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:border-neonBlue/60 hover:text-white transition';
    });
  }

  function resetAll() {
    state.search = '';
    state.categories = [];
    state.brands = [];
    state.condition = 'All';
    state.maxPrice = PRICE_CEIL;
    state.sort = 'rating-desc';
    searchInput.value = '';
    priceSlider.value = PRICE_CEIL;
    priceLabel.textContent = `$${PRICE_CEIL}`;
    document.getElementById('sort-select').value = 'rating-desc';
    document.querySelectorAll('.cond-btn').forEach((b) => b.classList.toggle('cond-active', b.dataset.cond === 'All'));
    syncChipStyles();
    render();
  }

  // --- Event wiring ---
  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.search = e.target.value; render(); }, 180);
  });

  document.querySelectorAll('.filter-chip').forEach((c) => {
    c.addEventListener('click', () => {
      const arr = state[c.dataset.group];
      const i = arr.indexOf(c.dataset.value);
      if (i === -1) arr.push(c.dataset.value); else arr.splice(i, 1);
      syncChipStyles();
      render();
    });
  });

  document.querySelectorAll('.cond-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.condition = b.dataset.cond;
      document.querySelectorAll('.cond-btn').forEach((x) => x.classList.remove('cond-active'));
      b.classList.add('cond-active');
      render();
    });
  });

  priceSlider.addEventListener('input', (e) => {
    state.maxPrice = Number(e.target.value);
    priceLabel.textContent = `$${state.maxPrice}`;
    render();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
  });

  const memberToggle = document.getElementById('member-toggle');
  memberToggle.addEventListener('change', (e) => {
    state.memberView = e.target.checked;
    render();
  });

  document.getElementById('reset-filters').addEventListener('click', resetAll);

  // Notify-me mini form — demonstrates the shared Validators module on a live input.
  const notifyBtn = document.getElementById('notify-btn');
  const notifyInput = document.getElementById('notify-email');
  const notifyMsg = document.getElementById('notify-msg');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', () => {
      const ok = window.Validators
        ? window.Validators.isValidEmail(notifyInput.value)
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyInput.value);
      if (!ok) {
        notifyMsg.textContent = 'Please enter a valid email address.';
        notifyMsg.className = 'text-xs font-mono mt-2 text-red-400';
      } else {
        notifyMsg.textContent = '✓ You are on the restock alert list.';
        notifyMsg.className = 'text-xs font-mono mt-2 text-neonBlue';
        notifyInput.value = '';
      }
    });
  }

  // --- Cart wiring (shared Cart module, member-aware, persisted) ---
  let cart = window.Cart ? window.Cart.load() : [];
  const cartBar = document.getElementById('cart-bar');
  const cartSummary = document.getElementById('cart-summary');
  const cartTotal = document.getElementById('cart-total');

  function refreshCartBar() {
    if (!window.Cart) return;
    const n = window.Cart.count(cart);
    const { total } = window.Cart.totals(cart, window.Cart.isMember());
    cartSummary.textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    cartTotal.textContent = `$${total}`;
    cartBar.classList.toggle('translate-y-full', n === 0);
  }

  // Event delegation: the grid re-renders on every filter, so listen on the parent.
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn || !window.Cart) return;
    const product = CATALOGUE.find((p) => p.id === btn.dataset.add);
    if (!product) return;
    cart = window.Cart.addItem(cart, product, 1);
    window.Cart.save(cart);
    refreshCartBar();
    btn.textContent = 'Added ✓';
    setTimeout(() => { btn.textContent = 'Add'; }, 900);
  });

  document.getElementById('cart-clear').addEventListener('click', () => {
    cart = [];
    window.Cart.clear();
    refreshCartBar();
  });

  refreshCartBar();
  priceLabel.textContent = `$${PRICE_CEIL}`;
  render();
});
