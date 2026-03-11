/**
 * INDEX DES HOOKS PARTAGÉS
 * Hooks communs utilisables dans Admin et Société
 */

// Hooks génériques
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop, 
  useBreakpoint,
  BREAKPOINTS 
} from './useMediaQuery';

// Hooks métier
export { useNotifications } from './useNotifications';
export type { NotificationType, NotificationOptions } from './useNotifications';

export { useExport } from './useExport';
export type { ExportFormat, ExportOptions } from './useExport';

export { useConfirm } from './useConfirm';
export type { ConfirmOptions, ConfirmState } from './useConfirm';