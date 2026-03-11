/**
 * ARRAY HELPERS
 * Fonctions utilitaires pour manipuler les tableaux
 * Évite la duplication de code entre Admin et Société
 */

/**
 * Grouper un tableau d'objets par une clé
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Trier un tableau par une ou plusieurs clés
 */
export function sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
    }
    return 0;
  });
}

/**
 * Obtenir des éléments uniques d'un tableau
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Obtenir des objets uniques par une clé
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Diviser un tableau en chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Mélanger un tableau (shuffle)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Compter les occurrences d'une valeur
 */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((result, item) => {
    const value = String(item[key]);
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {} as Record<string, number>);
}

/**
 * Obtenir le min et max d'un tableau de nombres
 */
export function minMax(array: number[]): { min: number; max: number } | null {
  if (array.length === 0) return null;
  return {
    min: Math.min(...array),
    max: Math.max(...array),
  };
}

/**
 * Calculer la somme d'un tableau
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculer la moyenne d'un tableau
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Paginer un tableau
 */
export function paginate<T>(array: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  return array.slice(startIndex, startIndex + pageSize);
}

/**
 * Filtrer les valeurs falsy d'un tableau
 */
export function compact<T>(array: (T | null | undefined | false | '' | 0)[]): T[] {
  return array.filter(Boolean) as T[];
}
