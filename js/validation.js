// js/validation.js
// =============================================================================
//  SIM & MOBILE — Centralised Form Validation Module
// -----------------------------------------------------------------------------
//  Pure, side-effect-free validation helpers used by every public form
//  (booking, enquiry, registration, reviews, shop notify). Written as a UMD
//  bundle so the SAME code runs in the browser (window.Validators) AND under
//  Node/Jest (module.exports) — meaning the rules we ship are the exact rules
//  we unit-test. No DOM access, no alerts: callers decide how to surface errors.
// =============================================================================

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api; // Node / Jest
  }
  if (typeof window !== 'undefined') {
    window.Validators = api; // Browser global
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Low-level primitives --------------------------------------------------

  /** Returns true when a value is present (non-empty after trimming). */
  function isRequired(value) {
    return typeof value === 'string' ? value.trim().length > 0 : value != null;
  }

  /** Human name: letters, spaces, hyphen, apostrophe, 2–30 chars. */
  function isValidName(value) {
    if (typeof value !== 'string') return false;
    return /^[A-Za-z][A-Za-z\s'-]{1,29}$/.test(value.trim());
  }

  /** Pragmatic email check (single @, a dot in the domain, no whitespace). */
  function isValidEmail(value) {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  /**
   * Australian phone number. Accepts mobile (04xx xxx xxx) and area-code
   * landlines (0x xxxx xxxx), with optional +61 country code and spaces.
   */
  function isValidAUPhone(value) {
    if (typeof value !== 'string') return false;
    const cleaned = value.replace(/[\s()-]/g, '');
    return /^(?:\+?61|0)[2-478]\d{8}$/.test(cleaned);
  }

  /** Password: 8+ chars, at least one letter and one digit. */
  function isValidPassword(value) {
    if (typeof value !== 'string') return false;
    return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
  }

  /** Coarse password strength bucket for UI meters. */
  function passwordStrength(value) {
    if (typeof value !== 'string' || value.length === 0) return 'empty';
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++; // mixed case
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++; // symbol
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) score++; // letters + digits
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  /** Star rating must be an integer 1–5. */
  function isValidRating(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 5;
  }

  /** Free text within an inclusive length window (e.g. review body, notes). */
  function isWithinLength(value, min, max) {
    if (typeof value !== 'string') return false;
    const len = value.trim().length;
    return len >= min && len <= max;
  }

  /**
   * Booking date (YYYY-MM-DD) must be a real calendar date that is today or
   * later — you cannot book a repair in the past.
   */
  function isTodayOrFuture(dateStr) {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    // Reject impossible dates like 2026-02-31 that Date silently rolls over.
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }

  /** Price filter sanity: both numeric, non-negative, min <= max. */
  function isValidPriceRange(min, max) {
    const lo = Number(min);
    const hi = Number(max);
    if (Number.isNaN(lo) || Number.isNaN(hi)) return false;
    return lo >= 0 && hi >= 0 && lo <= hi;
  }

  /** Strip angle brackets to neutralise the injection vectors the app guards against. */
  function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '').trim();
  }

  // --- Form-level aggregators ------------------------------------------------
  // Each returns { valid: boolean, errors: { field: message } } so the UI can
  // highlight individual inputs instead of firing a single generic alert.

  function validateBookingForm(form) {
    const f = form || {};
    const errors = {};
    if (!isValidName(f.firstName)) errors.firstName = 'First name must be 2–30 letters.';
    if (!isValidName(f.lastName)) errors.lastName = 'Last name must be 2–30 letters.';
    if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address.';
    if (!isValidAUPhone(f.phone)) errors.phone = 'Enter a valid Australian phone number.';
    if (!isRequired(f.date)) {
      errors.date = 'Please choose a date.';
    } else if (!isTodayOrFuture(f.date)) {
      errors.date = 'Booking date cannot be in the past.';
    }
    if (!isRequired(f.location)) errors.location = 'Please select a store location.';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateEnquiryForm(form) {
    const f = form || {};
    const errors = {};
    if (!isValidName(f.firstName)) errors.firstName = 'First name must be 2–30 letters.';
    if (!isValidName(f.lastName)) errors.lastName = 'Last name must be 2–30 letters.';
    if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address.';
    if (!isValidAUPhone(f.phone)) errors.phone = 'Enter a valid Australian phone number.';
    if (!isWithinLength(f.description, 10, 1000)) {
      errors.description = 'Description must be 10–1000 characters.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateReviewForm(form) {
    const f = form || {};
    const errors = {};
    if (!isValidRating(f.rating)) errors.rating = 'Select a star rating between 1 and 5.';
    if (!isWithinLength(f.content, 15, 600)) {
      errors.content = 'Review must be 15–600 characters.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateRegistrationForm(form) {
    const f = form || {};
    const errors = {};
    if (!isValidName(f.fullName)) errors.fullName = 'Full name must be 2–30 letters.';
    if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address.';
    if (!isValidPassword(f.password)) {
      errors.password = 'Password needs 8+ chars with a letter and a number.';
    }
    if (f.confirmPassword !== undefined && f.password !== f.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  return {
    isRequired,
    isValidName,
    isValidEmail,
    isValidAUPhone,
    isValidPassword,
    passwordStrength,
    isValidRating,
    isWithinLength,
    isTodayOrFuture,
    isValidPriceRange,
    sanitizeText,
    validateBookingForm,
    validateEnquiryForm,
    validateReviewForm,
    validateRegistrationForm,
  };
});
