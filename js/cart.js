// js/cart.js
// =============================================================================
//  SIM & MOBILE — Shopping Cart Module (shared by shop.html + checkout.html)
// -----------------------------------------------------------------------------
//  Pure cart maths (addItem / setQty / count / totals) plus thin localStorage
//  and membership helpers. The pure functions take and return plain data so
//  they are unit-tested directly; the storage layer reuses the SAME login keys
//  as the repair booking flow (isLoggedIn / userEmail / userName) so a member
//  is recognised identically across repairs and product orders.
// =============================================================================

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.Cart = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'simShopCart';

  // --- Pure cart maths (no storage, no DOM) --------------------------------

  /** Add a product (or +qty if already present). Returns a NEW cart array. */
  function addItem(cart, product, qty) {
    const amount = qty == null ? 1 : qty;
    const next = cart.map((i) => ({ ...i }));
    const found = next.find((i) => i.id === product.id);
    if (found) {
      found.qty += amount;
    } else {
      next.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        condition: product.condition,
        icon: product.icon,
        price: product.price,
        memberPrice: product.memberPrice,
        qty: amount,
      });
    }
    return next;
  }

  /** Set an item's quantity. qty <= 0 removes the line. Returns a NEW cart. */
  function setQty(cart, id, qty) {
    return cart
      .map((i) => (i.id === id ? { ...i, qty } : { ...i }))
      .filter((i) => i.qty > 0);
  }

  /** Remove a line entirely. */
  function removeItem(cart, id) {
    return cart.filter((i) => i.id !== id);
  }

  /** Total number of units across all lines. */
  function count(cart) {
    return cart.reduce((n, i) => n + i.qty, 0);
  }

  /**
   * Money totals. When isMember is true the effective price is memberPrice.
   * Returns { subtotal, total, savings } where subtotal is always RRP so the
   * UI can show the saving a member is getting.
   */
  function totals(cart, isMember) {
    let subtotal = 0;
    let total = 0;
    cart.forEach((i) => {
      subtotal += i.price * i.qty;
      total += (isMember ? i.memberPrice : i.price) * i.qty;
    });
    return {
      subtotal: round(subtotal),
      total: round(total),
      savings: round(subtotal - total),
    };
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  // --- Storage + membership (browser only) ---------------------------------

  function load() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function save(cart) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* storage full / disabled — ignore */
    }
  }

  function clear() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }

  /** Reads the SAME login keys as the repair booking flow. */
  function isMember() {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  function memberIdentity() {
    if (typeof localStorage === 'undefined') return { email: '', name: '' };
    return {
      email: localStorage.getItem('userEmail') || '',
      name: localStorage.getItem('userName') || '',
    };
  }

  return {
    STORAGE_KEY,
    addItem,
    setQty,
    removeItem,
    count,
    totals,
    load,
    save,
    clear,
    isMember,
    memberIdentity,
  };
});
