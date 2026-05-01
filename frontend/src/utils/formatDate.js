import dayjs from 'dayjs';

/**
 * Format a date string.
 * @param {string|Date} date
 * @param {string} format - dayjs format string (default: 'DD MMM YYYY')
 * @returns {string}
 */
export function formatDate(date, format = 'DD MMM YYYY') {
  if (!date) return '—';
  return dayjs(date).format(format);
}

/**
 * Format a date with time.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
}

/**
 * Get relative time (e.g. "2 hours ago").
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return '—';
  return dayjs(date).fromNow();
}
