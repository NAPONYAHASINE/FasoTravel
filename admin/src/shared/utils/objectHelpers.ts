/**
 * OBJECT HELPERS
 * Fonctions utilitaires pour manipuler les objets
 * Évite la duplication de code entre Admin et Société
 */

/**
 * Vérifier si un objet est vide
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Sélectionner certaines clés d'un objet
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Exclure certaines clés d'un objet
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * Deep merge de deux objets
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key as keyof T];
    const targetValue = result[key as keyof T];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key as keyof T] = deepMerge(targetValue, sourceValue);
    } else {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  });

  return result;
}

/**
 * Deep clone d'un objet
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    Object.keys(obj).forEach((key) => {
      clonedObj[key as keyof T] = deepClone((obj as any)[key]);
    });
    return clonedObj;
  }

  return obj;
}

/**
 * Obtenir une valeur nested d'un objet via un path
 * @example get(obj, 'user.address.city')
 */
export function get<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Définir une valeur nested d'un objet via un path
 * @example set(obj, 'user.address.city', 'Ouagadougou')
 */
export function set<T extends object>(obj: T, path: string, value: any): T {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: any = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Comparer deux objets (deep equality)
 */
export function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 == null ||
    obj2 == null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Nettoyer un objet en supprimant les valeurs null/undefined
 */
export function cleanObject<T extends object>(obj: T): Partial<T> {
  const result: any = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key as keyof T];
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Mapper les clés d'un objet
 */
export function mapKeys<T extends object>(
  obj: T,
  mapper: (key: string, value: any) => string
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = mapper(key, value);
    result[newKey] = value;
  });

  return result;
}

/**
 * Mapper les valeurs d'un objet
 */
export function mapValues<T extends object, R>(
  obj: T,
  mapper: (value: any, key: string) => R
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;

  Object.entries(obj).forEach(([key, value]) => {
    result[key as keyof T] = mapper(value, key);
  });

  return result;
}
