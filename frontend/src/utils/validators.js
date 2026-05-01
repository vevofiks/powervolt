/**
 * Form validation helpers.
 */

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return '';
  },

  email: (value) => {
    if (!value) return '';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? '' : 'Invalid email address';
  },

  phone: (value) => {
    if (!value) return '';
    const regex = /^[6-9]\d{9}$/;
    return regex.test(value) ? '' : 'Invalid phone number';
  },

  minLength: (min) => (value) => {
    if (!value) return '';
    return value.length >= min ? '' : `Must be at least ${min} characters`;
  },

  maxLength: (max) => (value) => {
    if (!value) return '';
    return value.length <= max ? '' : `Must be at most ${max} characters`;
  },

  positiveNumber: (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = Number(value);
    return num > 0 ? '' : 'Must be a positive number';
  },

  /**
   * Run multiple validators on a value.
   * @param {*} value
   * @param  {...Function} fns - Validator functions
   * @returns {string} First error message or empty string
   */
  compose: (value, ...fns) => {
    for (const fn of fns) {
      const error = fn(value);
      if (error) return error;
    }
    return '';
  },
};
