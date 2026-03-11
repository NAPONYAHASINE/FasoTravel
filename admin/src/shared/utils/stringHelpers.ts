/**
 * STRING HELPERS
 * Fonctions utilitaires pour manipuler les chaînes de caractères
 * Évite la duplication de code entre Admin et Société
 */

/**
 * Capitaliser la première lettre
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitaliser chaque mot
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Convertir en kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convertir en camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toLowerCase());
}

/**
 * Convertir en snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Tronquer une chaîne avec ellipsis
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Générer un slug URL-friendly
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin
}

/**
 * Compter les mots dans une chaîne
 */
export function wordCount(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).length;
}

/**
 * Vérifier si une chaîne contient uniquement des chiffres
 */
export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Vérifier si une chaîne est un email valide
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Vérifier si une chaîne est un numéro de téléphone valide (format Burkina Faso)
 */
export function isPhoneBF(str: string): boolean {
  // Format accepté: +226 XX XX XX XX ou 226XXXXXXXX ou XXXXXXXX (8 chiffres)
  const phoneRegex = /^(\+226|226)?([0-9]{8})$/;
  return phoneRegex.test(str.replace(/\s/g, ''));
}

/**
 * Formater un numéro de téléphone burkinabé
 */
export function formatPhoneBF(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro commence par 226, le supprimer
  const number = cleaned.startsWith('226') ? cleaned.slice(3) : cleaned;
  
  // Formater en XX XX XX XX
  if (number.length === 8) {
    return number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  
  return phone;
}

/**
 * Masquer une partie d'une chaîne (pour les données sensibles)
 */
export function mask(str: string, start: number = 0, end?: number, maskChar: string = '*'): string {
  if (!str) return '';
  const endPos = end ?? str.length;
  const masked = maskChar.repeat(endPos - start);
  return str.substring(0, start) + masked + str.substring(endPos);
}

/**
 * Générer des initiales à partir d'un nom
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  const initials = words
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  
  return initials.substring(0, maxLength);
}

/**
 * Formater un montant en FCFA
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(amount);
  return showSymbol ? `${formatted} FCFA` : formatted;
}

/**
 * Extraire les chiffres d'une chaîne
 */
export function extractNumbers(str: string): string {
  return str.replace(/\D/g, '');
}

/**
 * Vérifier si deux chaînes sont similaires (insensible à la casse et aux accents)
 */
export function isSimilar(str1: string, str2: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  
  return normalize(str1) === normalize(str2);
}

/**
 * Générer un ID aléatoire
 */
export function generateId(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Supprimer les espaces multiples et trim
 */
export function cleanWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Échapper les caractères HTML
 */
export function escapeHtml(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}
