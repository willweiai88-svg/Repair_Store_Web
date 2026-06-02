// tests/cart.test.js
const Cart = require('../js/cart.js');

const apple = { id: 'p11', name: 'iPhone 15 Pro (Refurb)', brand: 'Apple', condition: 'Refurbished', icon: '📲', price: 1099, memberPrice: 999 };
const cable = { id: 'p06', name: 'Braided USB-C Cable 2m', brand: 'Belkin', condition: 'New', icon: '🔌', price: 24, memberPrice: 19 };

describe('addItem', () => {
  test('adds a new line', () => {
    const cart = Cart.addItem([], apple, 1);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ id: 'p11', qty: 1, price: 1099, memberPrice: 999 });
  });
  test('increments quantity for an existing line', () => {
    let cart = Cart.addItem([], cable, 1);
    cart = Cart.addItem(cart, cable, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
  });
  test('does not mutate the input cart', () => {
    const original = [];
    Cart.addItem(original, apple);
    expect(original).toHaveLength(0);
  });
});

describe('setQty / removeItem', () => {
  test('setQty updates a line', () => {
    let cart = Cart.addItem([], apple, 1);
    cart = Cart.setQty(cart, 'p11', 4);
    expect(cart[0].qty).toBe(4);
  });
  test('setQty to 0 drops the line', () => {
    let cart = Cart.addItem([], apple, 1);
    cart = Cart.setQty(cart, 'p11', 0);
    expect(cart).toHaveLength(0);
  });
  test('removeItem deletes the matching line only', () => {
    let cart = Cart.addItem(Cart.addItem([], apple), cable);
    cart = Cart.removeItem(cart, 'p11');
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('p06');
  });
});

describe('count', () => {
  test('sums quantities across lines', () => {
    let cart = Cart.addItem([], apple, 2);
    cart = Cart.addItem(cart, cable, 3);
    expect(Cart.count(cart)).toBe(5);
  });
  test('empty cart counts zero', () => {
    expect(Cart.count([])).toBe(0);
  });
});

describe('totals', () => {
  let cart;
  beforeEach(() => {
    cart = Cart.addItem(Cart.addItem([], apple, 1), cable, 2); // 1099 + 24*2
  });
  test('guest pays RRP with no savings', () => {
    const t = Cart.totals(cart, false);
    expect(t.subtotal).toBe(1147);
    expect(t.total).toBe(1147);
    expect(t.savings).toBe(0);
  });
  test('member pays member price and savings are reported', () => {
    const t = Cart.totals(cart, true); // 999 + 19*2 = 1037
    expect(t.subtotal).toBe(1147);
    expect(t.total).toBe(1037);
    expect(t.savings).toBe(110);
  });
  test('empty cart totals zero', () => {
    expect(Cart.totals([], true)).toEqual({ subtotal: 0, total: 0, savings: 0 });
  });
});
