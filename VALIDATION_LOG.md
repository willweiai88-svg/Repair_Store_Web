# Validation & QA Log — Sim & Mobile

This document tracks the quality-assurance work for the page extensions: the
reusable validation module, the Jest test suite, and the test-run results.

## How to run

```bash
npm install          # installs jest + babel-jest + @babel/preset-env (devDependencies)
npm test             # runs the full suite
npm run test:coverage # runs with a coverage report
```

## Latest run

```
Test Suites: 3 passed, 3 total
Tests:       77 passed, 77 total
```

| Suite | File | What it covers |
|-------|------|----------------|
| Validation | `tests/validation.test.js` | All 15 validators + 4 form aggregators (57 cases) |
| Shop filters | `tests/shop.test.js` | Pure client-side filter/sort engine (9 cases) |
| Cart | `tests/cart.test.js` | Cart maths: add / setQty / remove / count / member totals (11 cases) |

Coverage of the instrumented module `js/validation.js`: **83% stmts / 81% branch / 94% funcs**.
The raw machine-generated transcript lives in [`logs/test-run.log`](logs/test-run.log).

## Validation rules under test

| Rule | Function | Accepts | Rejects |
|------|----------|---------|---------|
| Required field | `isRequired` | non-empty / non-null | "", whitespace, null |
| Person name | `isValidName` | 2–30 letters, spaces, `'` `-` | digits, 1 char, >30 |
| Email | `isValidEmail` | `user@host.tld` | missing `@`/dot, spaces |
| AU phone | `isValidAUPhone` | `04xx xxx xxx`, `+61…`, landlines | wrong length, non-AU |
| Password | `isValidPassword` | 8+ chars w/ letter+digit | short, letters-only |
| Strength meter | `passwordStrength` | weak / medium / strong | — |
| Star rating | `isValidRating` | integer 1–5 | 0, 6, decimals |
| Text length | `isWithinLength` | within [min,max] | too short/long |
| Booking date | `isTodayOrFuture` | today or later, real date | past, `2026-02-31` |
| Price range | `isValidPriceRange` | numeric, min ≤ max | negatives, reversed |
| Sanitiser | `sanitizeText` | strips `< >`, trims | — |

Form-level aggregators (`validateBookingForm`, `validateEnquiryForm`,
`validateReviewForm`, `validateRegistrationForm`) return
`{ valid, errors: { field: message } }` so the UI can highlight individual
inputs instead of firing one generic alert.

## Notes / follow-ups

- The module is a UMD bundle: the exact code shipped to the browser
  (`window.Validators`) is what the tests import — no drift between tested and
  shipped logic.
- Recommended next step: refactor the inline `alert()` checks in
  `js/booking.js` to call `Validators.validateBookingForm(...)` so the live
  forms reuse these tested rules. The functions are designed as a drop-in.
