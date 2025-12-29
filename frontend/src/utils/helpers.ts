/**
 * Shared utility functions
 */

// API URL - centralized configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Convert a relative image path to a full URL
 * Handles both absolute URLs and relative paths
 */
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  return `${API_URL}${imagePath}`;
};

/**
 * Format price in Vietnamese Dong
 */
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('vi-VN')}đ`;
};

/**
 * Format date in Vietnamese locale
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', options);
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate slug from text
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};
