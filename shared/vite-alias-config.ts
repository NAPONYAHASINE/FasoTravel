// vite-alias-config.ts
// Shared alias configuration for both Mobile and Societe apps
// Purpose: Centralize alias management to avoid duplication
// Location: c:\FasoTravel\shared\vite-alias-config.ts

import path from 'path';

export function getViteAliases(basePath: string, figmaAssets: Record<string, string> = {}) {
  return {
    // Figma assets (app-specific)
    ...figmaAssets,
    // Shared '@' alias for src directory
    '@': path.resolve(basePath, './src'),
  };
}

/**
 * IMPORTANT: Version-specific aliases have been removed.
 * Vite now resolves packages directly from node_modules.
 * 
 * This fixed the issue where:
 * - package.json requested motion@11.15.0
 * - node_modules contained motion@12.23.24
 * - Vite aliases tried to map v11 to v12
 * - Result: Runtime incompatibilities and blank pages
 *
 * Solution: Keep npm versions in sync + remove version-specific aliases
 */
