/**
 * @file index.ts
 * @description Export all shared utilities
 */

export * from './formatters';
export * from './validators';
export * from './arrayHelpers';
export * from './objectHelpers';
export { getRelativeTime, isToday, isThisWeek, isThisMonth, addDays, subtractDays, startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, diffInDays, getDateRange, isPast, isFuture } from './dateHelpers';
export { capitalizeWords, toKebabCase, toCamelCase, toSnakeCase, slugify, wordCount, isNumeric, isEmail, isPhoneBF, formatPhoneBF, mask, getInitials, extractNumbers, isSimilar, generateId, cleanWhitespace, escapeHtml } from './stringHelpers';