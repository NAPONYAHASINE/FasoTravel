/**
 * HOOKS D'OPTIMISATION PERFORMANCE - Phase 4
 * Hooks pour memoization, debouncing, et optimisations diverses
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// ===========================================
// DEBOUNCING & THROTTLING
// ===========================================

/**
 * Hook pour debouncer une valeur
 * La valeur ne change qu'après un délai sans changement
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour debouncer une fonction
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback((term) => {
 *   searchAPI(term);
 * }, 300);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Hook pour throttler une fonction
 * La fonction ne s'exécute qu'une fois par intervalle
 * 
 * @example
 * const throttledScroll = useThrottle(() => {
 *   handleScroll();
 * }, 100);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastRunRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );
}

// ===========================================
// MEMOIZATION AVANCÉE
// ===========================================

/**
 * Hook pour memoizer des calculs coûteux avec dépendances multiples
 * Similaire à useMemo mais avec logging en dev
 * 
 * @example
 * const expensiveResult = useMemoWithLogging(
 *   () => computeExpensiveValue(a, b, c),
 *   [a, b, c],
 *   'ExpensiveComputation'
 * );
 */
export function useMemoWithLogging<T>(
  factory: () => T,
  deps: React.DependencyList,
  label?: string
): T {
  const previousDepsRef = useRef<React.DependencyList | undefined>(undefined);
  const computeCountRef = useRef(0);

  const result = useMemo(() => {
    computeCountRef.current++;
    
    if (process.env.NODE_ENV === 'development' && label) {
      console.log(`[Memo ${label}] Calcul #${computeCountRef.current}`);
      
      if (previousDepsRef.current) {
        const changedDeps = deps
          .map((dep, i) => (dep !== previousDepsRef.current![i] ? i : -1))
          .filter((i) => i !== -1);
        
        if (changedDeps.length > 0) {
          console.log(`[Memo ${label}] Dépendances changées:`, changedDeps);
        }
      }
    }

    previousDepsRef.current = deps;
    return factory();
  }, deps);

  return result;
}

/**
 * Hook pour memoizer des callbacks lourds avec logging
 * 
 * @example
 * const handleClick = useCallbackWithLogging(
 *   (id) => processHeavyOperation(id),
 *   [dependency],
 *   'HeavyOperation'
 * );
 */
export function useCallbackWithLogging<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  label?: string
): T {
  const previousDepsRef = useRef<React.DependencyList | undefined>(undefined);
  const recreateCountRef = useRef(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (process.env.NODE_ENV === 'development' && label) {
        if (previousDepsRef.current !== deps) {
          recreateCountRef.current++;
          console.log(`[Callback ${label}] Recréé #${recreateCountRef.current}`);
        }
      }

      previousDepsRef.current = deps;
      return callback(...args);
    }) as T,
    deps
  );
}

// ===========================================
// INTERSECTION OBSERVER (Lazy Load)
// ===========================================

/**
 * Hook pour détecter quand un élément entre dans le viewport
 * Utile pour lazy loading d'images ou de composants
 * 
 * @example
 * const { ref, isVisible } = useIntersectionObserver();
 * return <div ref={ref}>{isVisible && <ExpensiveComponent />}</div>;
 */
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [node, setNode] = useState<Element | null>(null);

  const observer = useMemo(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return null;
    }

    return new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);
  }, [options.threshold, options.root, options.rootMargin]);

  useEffect(() => {
    if (!node || !observer) return;

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, observer]);

  return {
    ref: setNode,
    isVisible,
  };
}

// ===========================================
// VIRTUAL SCROLLING HELPER
// ===========================================

/**
 * Hook pour gérer le virtual scrolling
 * Affiche seulement les items visibles dans le viewport
 * 
 * @example
 * const { visibleItems, containerRef } = useVirtualScroll(allItems, 50);
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number = 600,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      offsetTop: (visibleRange.startIndex + index) * itemHeight,
    }));
  }, [items, visibleRange, itemHeight]);

  return {
    visibleItems,
    containerRef,
    totalHeight: items.length * itemHeight,
    startIndex: visibleRange.startIndex,
  };
}

// ===========================================
// PERFORMANCE MONITORING
// ===========================================

/**
 * Hook pour mesurer le temps de rendu d'un composant
 * En dev uniquement
 * 
 * @example
 * useRenderTime('MyExpensiveComponent');
 */
export function useRenderTime(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current++;
    const renderTime = performance.now() - startTimeRef.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Render ${componentName}] #${renderCountRef.current} - ${renderTime.toFixed(2)}ms`
      );
    }

    startTimeRef.current = performance.now();
  });
}

/**
 * Hook pour logger les re-renders et identifier les causes
 * 
 * @example
 * useWhyDidYouUpdate('MyComponent', { prop1, prop2, state1 });
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, any>) {
  const previousPropsRef = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousPropsRef.current) {
      const allKeys = Object.keys({ ...previousPropsRef.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousPropsRef.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousPropsRef.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${componentName}] Props changés:`, changedProps);
      }
    }

    previousPropsRef.current = props;
  });
}

// ===========================================
// IDLE CALLBACK
// ===========================================

/**
 * Hook pour exécuter du code pendant les périodes d'inactivité du navigateur
 * Utile pour les tâches non critiques
 * 
 * @example
 * useIdleCallback(() => {
 *   preloadNextPage();
 * }, [currentPage]);
 */
export function useIdleCallback(callback: () => void, deps: React.DependencyList) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
      const timer = setTimeout(callback, 1);
      return () => clearTimeout(timer);
    }

    const id = (window as any).requestIdleCallback(callback, { timeout: 2000 });

    return () => {
      (window as any).cancelIdleCallback(id);
    };
  }, deps);
}
