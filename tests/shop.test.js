// tests/shop.test.js
// Unit tests for the pure client-side filter engine in js/shop.js
const { applyFilters, CATALOGUE } = require('../js/shop.js');

const base = () => ({
  search: '',
  categories: [],
  brands: [],
  condition: 'All',
  maxPrice: 9999,
  sort: 'rating-desc',
  memberView: false,
});

describe('applyFilters', () => {
  test('returns the full catalogue with default state', () => {
    expect(applyFilters(CATALOGUE, base()).length).toBe(CATALOGUE.length);
  });

  test('text search matches name, brand, or category (case-insensitive)', () => {
    const res = applyFilters(CATALOGUE, { ...base(), search: 'anker' });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => p.brand === 'Anker')).toBe(true);
  });

  test('category multi-select acts as an OR within the group', () => {
    const res = applyFilters(CATALOGUE, { ...base(), categories: ['Cases', 'Audio'] });
    expect(res.every((p) => ['Cases', 'Audio'].includes(p.category))).toBe(true);
  });

  test('brand and category combine as AND across groups', () => {
    const res = applyFilters(CATALOGUE, { ...base(), categories: ['Cases'], brands: ['Apple'] });
    expect(res.every((p) => p.category === 'Cases' && p.brand === 'Apple')).toBe(true);
  });

  test('condition filter isolates refurbished stock', () => {
    const res = applyFilters(CATALOGUE, { ...base(), condition: 'Refurbished' });
    expect(res.every((p) => p.condition === 'Refurbished')).toBe(true);
  });

  test('max price uses RRP normally and member price in member view', () => {
    const cheapRRP = applyFilters(CATALOGUE, { ...base(), maxPrice: 50 });
    expect(cheapRRP.every((p) => p.price <= 50)).toBe(true);
    const cheapMember = applyFilters(CATALOGUE, { ...base(), maxPrice: 50, memberView: true });
    expect(cheapMember.every((p) => p.memberPrice <= 50)).toBe(true);
  });

  test('sort by price ascending orders correctly', () => {
    const res = applyFilters(CATALOGUE, { ...base(), sort: 'price-asc' });
    for (let i = 1; i < res.length; i++) {
      expect(res[i].price).toBeGreaterThanOrEqual(res[i - 1].price);
    }
  });

  test('does not mutate the source catalogue', () => {
    const before = CATALOGUE.map((p) => p.id).join(',');
    applyFilters(CATALOGUE, { ...base(), sort: 'price-desc' });
    expect(CATALOGUE.map((p) => p.id).join(',')).toBe(before);
  });

  test('impossible filter combo returns empty list', () => {
    const res = applyFilters(CATALOGUE, { ...base(), categories: ['Parts'], brands: ['Belkin'] });
    expect(res).toEqual([]);
  });
});
