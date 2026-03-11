/**
 * @file validators.ts
 * @description Utility functions for data validation
 */

import { VALIDATION } from '../services/constants';

// ============= EMAIL VALIDATION =============

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email) && email.length <= VALIDATION.EMAIL_MAX_LENGTH;
}

/**
 * Get email validation error message
 */
export function getEmailError(email: string): string | null {
  if (!email) return 'L\'email est requis';
  if (!isValidEmail(email)) return 'Format d\'email invalide';
  return null;
}

// ============= PASSWORD VALIDATION =============

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  if (!password) return false;
  
  const { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = VALIDATION;
  
  // Check length
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return false;
  }
  
  // Must contain: uppercase, lowercase, number, special char
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Get password validation error message
 */
export function getPasswordError(password: string): string | null {
  if (!password) return 'Le mot de passe est requis';
  
  const { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = VALIDATION;
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères`;
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une minuscule';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre';
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un caractère spécial';
  }
  
  return null;
}

/**
 * Calculate password strength (0-100)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length score (0-40 points)
  strength += Math.min(password.length * 2, 40);
  
  // Character variety (0-60 points)
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;
  
  // Extra length bonus
  if (password.length > 12) strength += 10;
  if (password.length > 16) strength += 10;
  
  return Math.min(strength, 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(password: string): string {
  const strength = getPasswordStrength(password);
  
  if (strength < 30) return 'Très faible';
  if (strength < 50) return 'Faible';
  if (strength < 70) return 'Moyen';
  if (strength < 90) return 'Fort';
  return 'Très fort';
}

// ============= PHONE VALIDATION =============

/**
 * Validate phone number (simplified - can be enhanced per country)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  const { PHONE_MIN_LENGTH, PHONE_MAX_LENGTH } = VALIDATION;
  
  // Check length
  if (cleaned.length < PHONE_MIN_LENGTH || cleaned.length > PHONE_MAX_LENGTH) {
    return false;
  }
  
  // Basic format check
  return /^[\d+]+$/.test(cleaned);
}

/**
 * Get phone validation error message
 */
export function getPhoneError(phone: string): string | null {
  if (!phone) return 'Le numéro de téléphone est requis';
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  const { PHONE_MIN_LENGTH, PHONE_MAX_LENGTH } = VALIDATION;
  
  if (cleaned.length < PHONE_MIN_LENGTH) {
    return 'Le numéro de téléphone est trop court';
  }
  
  if (cleaned.length > PHONE_MAX_LENGTH) {
    return 'Le numéro de téléphone est trop long';
  }
  
  if (!isValidPhone(phone)) {
    return 'Format de numéro de téléphone invalide';
  }
  
  return null;
}

// ============= NAME VALIDATION =============

/**
 * Validate name
 */
export function isValidName(name: string): boolean {
  if (!name) return false;
  
  const trimmed = name.trim();
  
  // Check length
  if (trimmed.length === 0 || trimmed.length > VALIDATION.NAME_MAX_LENGTH) {
    return false;
  }
  
  // Only letters, spaces, hyphens, apostrophes
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
}

/**
 * Get name validation error message
 */
export function getNameError(name: string): string | null {
  if (!name) return 'Le nom est requis';
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) return 'Le nom ne peut pas être vide';
  if (trimmed.length > VALIDATION.NAME_MAX_LENGTH) {
    return `Le nom ne doit pas dépasser ${VALIDATION.NAME_MAX_LENGTH} caractères`;
  }
  
  if (!isValidName(name)) {
    return 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes';
  }
  
  return null;
}

// ============= DATE VALIDATION =============

/**
 * Validate date is not in the past
 */
export function isDateInFuture(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return d >= now;
}

/**
 * Validate date is in the past
 */
export function isDateInPast(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  return d <= now;
}

/**
 * Validate date is today
 */
export function isDateToday(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * Validate date is within range
 */
export function isDateInRange(
  date: string | Date,
  minDate: string | Date,
  maxDate: string | Date
): boolean {
  const d = new Date(date);
  const min = new Date(minDate);
  const max = new Date(maxDate);
  
  return d >= min && d <= max;
}

// ============= NUMBER VALIDATION =============

/**
 * Validate number is positive
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate number is non-negative
 */
export function isNonNegativeNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate number is within range
 */
export function isNumberInRange(value: any, min: number, max: number): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

// ============= REQUIRED FIELD VALIDATION =============

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
}

/**
 * Get required field error message
 */
export function getRequiredError(fieldName: string): string {
  return `${fieldName} est requis`;
}

// ============= PRICE VALIDATION =============

/**
 * Validate price
 */
export function isValidPrice(price: any): boolean {
  const num = Number(price);
  return !isNaN(num) && num >= 0 && num <= 10000000; // Max 10 million
}

/**
 * Get price validation error message
 */
export function getPriceError(price: any): string | null {
  if (!isRequired(price)) return 'Le prix est requis';
  
  const num = Number(price);
  
  if (isNaN(num)) return 'Le prix doit être un nombre valide';
  if (num < 0) return 'Le prix ne peut pas être négatif';
  if (num > 10000000) return 'Le prix est trop élevé';
  
  return null;
}

// ============= SEAT NUMBER VALIDATION =============

/**
 * Validate seat number format (e.g., A1, B12, etc.)
 */
export function isValidSeatNumber(seat: string): boolean {
  if (!seat) return false;
  
  // Format: Letter(s) followed by number(s)
  // Examples: A1, AB12, C5
  return /^[A-Z]+\d+$/.test(seat.toUpperCase());
}

/**
 * Get seat number validation error message
 */
export function getSeatNumberError(seat: string): string | null {
  if (!seat) return 'Le numéro de siège est requis';
  if (!isValidSeatNumber(seat)) {
    return 'Format de siège invalide (ex: A1, B12)';
  }
  return null;
}

// ============= COORDINATES VALIDATION =============

/**
 * Validate latitude
 */
export function isValidLatitude(lat: any): boolean {
  const num = Number(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng: any): boolean {
  const num = Number(lng);
  return !isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: any, lng: any): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

// ============= FORM VALIDATION =============

/**
 * Validate entire form
 */
export function validateForm(
  values: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(values[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
}

/**
 * Check if form has errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
