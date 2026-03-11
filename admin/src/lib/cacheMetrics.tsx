/**
 * @file cacheMetrics.ts
 * @description Utilitaires pour monitorer le cache LRU en développement
 * 
 * USAGE EN CONSOLE:
 * - window.__cacheMetrics() - Voir les métriques actuelles
 * - window.__cacheInvalidate('operators') - Invalider pattern
 * - window.__cacheClear() - Vider tout le cache
 */

// Ces fonctions sont exposées automatiquement en mode développement
// Voir /hooks/useApi.ts ligne ~230

/**
 * EXEMPLE D'UTILISATION EN CONSOLE DÉVELOPPEUR:
 * 
 * 1. Voir les métriques de cache:
 * ```javascript
 * window.__cacheMetrics()
 * // Output:
 * // {
 * //   size: 15,              // Nombre d'entrées
 * //   currentSize: 245760,   // Taille en bytes
 * //   maxSize: 52428800,     // Max 50 MB
 * //   hits: 42,              // Cache hits
 * //   misses: 8,             // Cache misses
 * //   hitRate: "84.00%"      // Taux de succès
 * // }
 * ```
 * 
 * 2. Analyser la performance:
 * ```javascript
 * const metrics = window.__cacheMetrics();
 * console.log(`Hit Rate: ${metrics.hitRate}`);
 * console.log(`Memory Usage: ${(metrics.currentSize / 1024 / 1024).toFixed(2)} MB`);
 * ```
 * 
 * 3. Invalider le cache d'une ressource:
 * ```javascript
 * window.__cacheInvalidate('operators'); // Invalide tous les endpoints contenant 'operators'
 * ```
 * 
 * 4. Vider complètement le cache:
 * ```javascript
 * window.__cacheClear();
 * ```
 */

// Types pour TypeScript
declare global {
  interface Window {
    __cacheMetrics?: () => {
      size: number;
      currentSize: number;
      maxSize: number;
      hits: number;
      misses: number;
      hitRate: string;
    };
    __cacheInvalidate?: (pattern: string) => void;
    __cacheClear?: () => void;
  }
}

/**
 * Hook pour monitorer les métriques de cache dans un composant
 */
export function useCacheMetrics() {
  if (typeof window !== 'undefined' && window.__cacheMetrics) {
    return window.__cacheMetrics();
  }
  
  return {
    size: 0,
    currentSize: 0,
    maxSize: 0,
    hits: 0,
    misses: 0,
    hitRate: '0%',
  };
}

/**
 * Composant de debug pour afficher les métriques de cache
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Database, Trash2, RefreshCw } from 'lucide-react';

export function CacheMetricsDebug() {
  const [metrics, setMetrics] = useState(useCacheMetrics());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(useCacheMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setMetrics(useCacheMetrics());
  };

  const handleClear = () => {
    if (window.__cacheClear) {
      window.__cacheClear();
      setMetrics(useCacheMetrics());
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getHitRateColor = (hitRate: string) => {
    const rate = parseFloat(hitRate);
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache Metrics (Dev Only)
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hit Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Hit Rate</span>
            <Badge className={getHitRateColor(metrics.hitRate)}>
              {metrics.hitRate}
            </Badge>
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium text-green-600">{metrics.hits}</span> hits
            </div>
            <div>
              <span className="font-medium text-red-600">{metrics.misses}</span> misses
            </div>
          </div>
        </div>

        {/* Cache Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cache Size</span>
            <Badge variant="outline">{metrics.size} entries</Badge>
          </div>
          <div className="text-xs text-gray-600">
            {formatBytes(metrics.currentSize)} / {formatBytes(metrics.maxSize)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(metrics.currentSize / metrics.maxSize) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-xs text-gray-500">
            Console Commands:
          </div>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono">
            <div>window.__cacheMetrics()</div>
            <div>window.__cacheInvalidate('pattern')</div>
            <div>window.__cacheClear()</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook pour logger automatiquement les métriques de cache
 * Utile pour le debugging en développement
 */
export function useLogCacheMetrics(intervalMs = 5000) {
  useEffect(() => {
    if (import.meta.env.PROD) return;

    const interval = setInterval(() => {
      const metrics = useCacheMetrics();
      console.log('[Cache Metrics]', metrics);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
}

export default {
  useCacheMetrics,
  CacheMetricsDebug,
  useLogCacheMetrics,
};
