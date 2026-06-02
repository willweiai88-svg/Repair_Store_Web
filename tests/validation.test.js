// tests/validation.test.js
// =============================================================================
//  Unit tests for js/validation.js  (run with `npm test`)
//  Coverage goal: every exported validator, with valid / invalid / edge cases.
// =============================================================================

const V = require('../js/validation.js');

describe('isRequired', () => {
  test('accepts non-empty strings and values', () => {
    expect(V.isRequired('hello')).toBe(true);
    expect(V.isRequired('0')).toBe(true);
    expect(V.isRequired(0)).toBe(true);
  });
  test('rejects empty / whitespace / nullish', () => {
    expect(V.isRequired('')).toBe(false);
    expect(V.isRequired('   ')).toBe(false);
    expect(V.isRequired(null)).toBe(false);
    expect(V.isRequired(undefined)).toBe(false);
  });
});

describe('isValidName', () => {
  test.each(['Wei', "O'Brien", 'Anne-Marie', 'Van Der Berg'])('accepts %s', (n) => {
    expect(V.isValidName(n)).toBe(true);
  });
  test.each(['A', '', '123', 'John99', 'a'.repeat(31)])('rejects %s', (n) => {
    expect(V.isValidName(n)).toBe(false);
  });
});

describe('isValidEmail', () => {
  test.each(['a@b.co', 'wei.wei@simmobile.com.au', 'x_y+z@sub.domain.io'])(
    'accepts %s',
    (e) => expect(V.isValidEmail(e)).toBe(true)
  );
  test.each(['plainaddress', 'no@domain', 'two@@at.com', 'space @x.com', ''])(
    'rejects %s',
    (e) => expect(V.isValidEmail(e)).toBe(false)
  );
});

describe('isValidAUPhone', () => {
  test.each(['0466052993', '0466 052 993', '+61466052993', '02 9876 5432', '(02) 9876 5432'])(
    'accepts %s',
    (p) => expect(V.isValidAUPhone(p)).toBe(true)
  );
  test.each(['123', '0123456789', '04660529', '00000000000', 'abcdefghij', ''])(
    'rejects %s',
    (p) => expect(V.isValidAUPhone(p)).toBe(false)
  );
});

describe('isValidPassword & passwordStrength', () => {
  test('valid passwords need length + letter + digit', () => {
    expect(V.isValidPassword('password123')).toBe(true);
    expect(V.isValidPassword('short1')).toBe(false);
    expect(V.isValidPassword('allletters')).toBe(false);
    expect(V.isValidPassword('12345678')).toBe(false);
  });
  test('strength buckets', () => {
    expect(V.passwordStrength('')).toBe('empty');
    expect(V.passwordStrength('abc')).toBe('weak');
    expect(V.passwordStrength('password123')).toBe('medium');
    expect(V.passwordStrength('Str0ng!Passphrase')).toBe('strong');
  });
});

describe('isValidRating', () => {
  test.each([1, 2, 3, 4, 5, '5'])('accepts %s', (r) => expect(V.isValidRating(r)).toBe(true));
  test.each([0, 6, 2.5, -1, 'five', null])('rejects %s', (r) =>
    expect(V.isValidRating(r)).toBe(false)
  );
});

describe('isWithinLength', () => {
  test('respects inclusive bounds (trimmed)', () => {
    expect(V.isWithinLength('hello', 1, 10)).toBe(true);
    expect(V.isWithinLength('   hi   ', 2, 2)).toBe(true);
    expect(V.isWithinLength('toolong', 1, 3)).toBe(false);
    expect(V.isWithinLength('', 1, 5)).toBe(false);
  });
});

describe('isTodayOrFuture', () => {
  const fmt = (d) => d.toISOString().slice(0, 10);
  test('accepts today and tomorrow', () => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    expect(V.isTodayOrFuture(fmt(today))).toBe(true);
    expect(V.isTodayOrFuture(fmt(tomorrow))).toBe(true);
  });
  test('rejects past, malformed, and impossible dates', () => {
    expect(V.isTodayOrFuture('2000-01-01')).toBe(false);
    expect(V.isTodayOrFuture('2026-13-01')).toBe(false);
    expect(V.isTodayOrFuture('2026-02-31')).toBe(false);
    expect(V.isTodayOrFuture('not-a-date')).toBe(false);
    expect(V.isTodayOrFuture('')).toBe(false);
  });
});

describe('isValidPriceRange', () => {
  test('valid ranges', () => {
    expect(V.isValidPriceRange(0, 500)).toBe(true);
    expect(V.isValidPriceRange(100, 100)).toBe(true);
    expect(V.isValidPriceRange('50', '200')).toBe(true);
  });
  test('invalid ranges', () => {
    expect(V.isValidPriceRange(500, 100)).toBe(false);
    expect(V.isValidPriceRange(-1, 100)).toBe(false);
    expect(V.isValidPriceRange('abc', 100)).toBe(false);
  });
});

describe('sanitizeText', () => {
  test('strips angle brackets and trims', () => {
    expect(V.sanitizeText('  <script>x</script>  ')).toBe('scriptx/script');
    expect(V.sanitizeText('safe text')).toBe('safe text');
    expect(V.sanitizeText(42)).toBe('');
  });
});

describe('validateBookingForm', () => {
  const good = {
    firstName: 'Wei',
    lastName: 'Wei',
    email: 'wei@simmobile.com.au',
    phone: '0466052993',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    location: 'Sydney CBD',
  };
  test('passes a complete valid form', () => {
    expect(V.validateBookingForm(good)).toEqual({ valid: true, errors: {} });
  });
  test('collects field-level errors', () => {
    const res = V.validateBookingForm({ ...good, email: 'bad', phone: '123', date: '2000-01-01' });
    expect(res.valid).toBe(false);
    expect(res.errors).toHaveProperty('email');
    expect(res.errors).toHaveProperty('phone');
    expect(res.errors).toHaveProperty('date');
  });
  test('handles undefined input safely', () => {
    expect(V.validateBookingForm().valid).toBe(false);
  });
});

describe('validateReviewForm', () => {
  test('valid review', () => {
    expect(V.validateReviewForm({ rating: 5, content: 'Great fast repair service!' }).valid).toBe(true);
  });
  test('flags low rating and short content', () => {
    const res = V.validateReviewForm({ rating: 9, content: 'short' });
    expect(res.errors).toHaveProperty('rating');
    expect(res.errors).toHaveProperty('content');
  });
});

describe('validateRegistrationForm', () => {
  test('valid registration', () => {
    expect(
      V.validateRegistrationForm({
        fullName: 'Wei Wei',
        email: 'wei@x.com',
        password: 'password123',
        confirmPassword: 'password123',
      }).valid
    ).toBe(true);
  });
  test('detects mismatched passwords', () => {
    const res = V.validateRegistrationForm({
      fullName: 'Wei Wei',
      email: 'wei@x.com',
      password: 'password123',
      confirmPassword: 'different1',
    });
    expect(res.errors).toHaveProperty('confirmPassword');
  });
});
