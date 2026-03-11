# 🧪 Guide de Tests - Hooks Métier & Services API

## 📋 Vue d'ensemble

Ce guide explique comment tester les hooks métier, les services API et le système de cache créés dans la Phase 2.

---

## 🎯 Structure de Tests Recommandée

```
/tests
  /hooks
    useApi.test.ts
    useResources.test.ts
  /services
    operatorService.test.ts
    stationService.test.ts
    authService.test.ts
  /cache
    lruCache.test.ts
```

---

## 🧪 1. Tests des Hooks Génériques

### Test de `useApi<T>`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';

// Mock apiClient
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi('/test-endpoint'));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(apiClient.get).toHaveBeenCalledWith('/test-endpoint', { retry: 1 });
  });

  it('should handle errors', async () => {
    const mockError = new Error('Network error');
    (apiClient.get as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi('/test-endpoint'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(mockError);
  });

  it('should use cache on second call', async () => {
    const mockData = { id: '1', name: 'Test' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockData);

    // First call
    const { result: result1 } = renderHook(() => useApi('/test-endpoint'));
    await waitFor(() => expect(result1.current.loading).toBe(false));

    // Second call (should use cache)
    const { result: result2 } = renderHook(() => useApi('/test-endpoint'));
    await waitFor(() => expect(result2.current.loading).toBe(false));

    // API should be called only once
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(mockData);
  });

  it('should refetch on manual refetch call', async () => {
    const mockData = { id: '1', name: 'Test' };
    (apiClient.get as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi('/test-endpoint'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Manual refetch
    await result.current.refetch();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => 
      useApi('/test-endpoint', { enabled: false })
    );

    expect(result.current.loading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
```

### Test de `useMutation<T>`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMutation } from '../../hooks/useApi';

describe('useMutation', () => {
  it('should mutate successfully', async () => {
    const mockMutationFn = jest.fn().mockResolvedValue({ id: '1', name: 'Created' });
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useMutation(mockMutationFn, { onSuccess })
    );

    // Initial state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Mutate
    const variables = { name: 'Test' };
    const promise = result.current.mutate(variables);

    expect(result.current.loading).toBe(true);

    await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: '1', name: 'Created' });
    expect(mockMutationFn).toHaveBeenCalledWith(variables);
    expect(onSuccess).toHaveBeenCalledWith({ id: '1', name: 'Created' }, variables);
  });

  it('should handle mutation errors', async () => {
    const mockError = new Error('Mutation failed');
    const mockMutationFn = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useMutation(mockMutationFn, { onError })
    );

    await expect(result.current.mutate({ name: 'Test' })).rejects.toThrow(mockError);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(onError).toHaveBeenCalledWith(mockError, { name: 'Test' });
  });

  it('should reset mutation state', async () => {
    const mockMutationFn = jest.fn().mockResolvedValue({ id: '1' });

    const { result } = renderHook(() => useMutation(mockMutationFn));

    await result.current.mutate({ name: 'Test' });

    expect(result.current.data).not.toBe(null);

    result.current.reset();

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });
});
```

---

## 🧪 2. Tests des Hooks Métier

### Test de `useOperators`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useOperators } from '../../hooks/useResources';
import { operatorService } from '../../services';

jest.mock('../../services', () => ({
  operatorService: {
    getAll: jest.fn(),
  },
}));

describe('useOperators', () => {
  it('should fetch operators', async () => {
    const mockOperators = {
      data: [
        { id: '1', name: 'Operator 1', status: 'active' },
        { id: '2', name: 'Operator 2', status: 'pending' },
      ],
      meta: { page: 1, limit: 10, total: 2 },
    };

    (operatorService.getAll as jest.Mock).mockResolvedValue(mockOperators);

    const { result } = renderHook(() => 
      useOperators({ page: 1, limit: 10, status: 'active' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockOperators);
  });
});
```

### Test de `useUpdateOperator`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateOperator } from '../../hooks/useResources';
import { operatorService } from '../../services';
import { useInvalidateCache } from '../../hooks/useApi';

jest.mock('../../services');
jest.mock('../../hooks/useApi', () => ({
  ...jest.requireActual('../../hooks/useApi'),
  useInvalidateCache: jest.fn(() => jest.fn()),
}));

describe('useUpdateOperator', () => {
  it('should update operator and invalidate cache', async () => {
    const mockUpdatedOperator = { id: '1', name: 'Updated', status: 'active' };
    (operatorService.update as jest.Mock).mockResolvedValue(mockUpdatedOperator);

    const mockInvalidateCache = jest.fn();
    (useInvalidateCache as jest.Mock).mockReturnValue(mockInvalidateCache);

    const { result } = renderHook(() => useUpdateOperator());

    const variables = { id: '1', data: { name: 'Updated' } };
    await result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(operatorService.update).toHaveBeenCalledWith('1', { name: 'Updated' });
    expect(mockInvalidateCache).toHaveBeenCalledWith('operators/1');
    expect(mockInvalidateCache).toHaveBeenCalledWith('operators');
  });
});
```

---

## 🧪 3. Tests des Services

### Test de `operatorService`

```typescript
import { operatorService } from '../../services';
import { apiClient } from '../../services/api';
import { ENDPOINTS } from '../../services/endpoints';

jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('operatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = { data: [], meta: {} };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10, status: 'active' };
      const result = await operatorService.getAll(params);

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.operators.list(params));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('should call apiClient.post with correct data', async () => {
      const mockOperator = { id: '1', name: 'New Operator' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockOperator);

      const data = { name: 'New Operator', email: 'test@example.com' };
      const result = await operatorService.create(data);

      expect(apiClient.post).toHaveBeenCalledWith(ENDPOINTS.operators.create(), data);
      expect(result).toEqual(mockOperator);
    });
  });

  describe('update', () => {
    it('should call apiClient.put with correct id and data', async () => {
      const mockOperator = { id: '1', name: 'Updated' };
      (apiClient.put as jest.Mock).mockResolvedValue(mockOperator);

      const result = await operatorService.update('1', { name: 'Updated' });

      expect(apiClient.put).toHaveBeenCalledWith(
        ENDPOINTS.operators.update('1'),
        { name: 'Updated' }
      );
      expect(result).toEqual(mockOperator);
    });
  });

  describe('delete', () => {
    it('should call apiClient.delete with correct id', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ success: true });

      await operatorService.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith(ENDPOINTS.operators.delete('1'));
    });
  });

  describe('toggleStatus', () => {
    it('should call apiClient.patch with correct endpoint', async () => {
      const mockOperator = { id: '1', status: 'suspended' };
      (apiClient.patch as jest.Mock).mockResolvedValue(mockOperator);

      const result = await operatorService.toggleStatus('1');

      expect(apiClient.patch).toHaveBeenCalledWith(
        ENDPOINTS.operators.toggleStatus('1')
      );
      expect(result).toEqual(mockOperator);
    });
  });
});
```

---

## 🧪 4. Tests du Cache LRU

### Test de la classe LRUCache

```typescript
// Note: Ces tests nécessitent d'exporter LRUCache depuis useApi.ts pour le test

describe('LRUCache', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache();
  });

  it('should store and retrieve data', () => {
    const data = { id: '1', name: 'Test' };
    cache.set('key1', data);

    const retrieved = cache.get('key1', 10000);
    expect(retrieved).toEqual(data);
  });

  it('should return null for expired cache', () => {
    const data = { id: '1', name: 'Test' };
    cache.set('key1', data);

    // Wait for cache to expire
    jest.advanceTimersByTime(11000);

    const retrieved = cache.get('key1', 10000);
    expect(retrieved).toBe(null);
  });

  it('should invalidate by pattern', () => {
    cache.set('/operators/1', { id: '1' });
    cache.set('/operators/2', { id: '2' });
    cache.set('/stations/1', { id: '1' });

    const count = cache.invalidatePattern('operators');

    expect(count).toBe(2);
    expect(cache.get('/operators/1', 10000)).toBe(null);
    expect(cache.get('/stations/1', 10000)).not.toBe(null);
  });

  it('should clear all cache', () => {
    cache.set('key1', { id: '1' });
    cache.set('key2', { id: '2' });

    cache.clear();

    expect(cache.get('key1', 10000)).toBe(null);
    expect(cache.get('key2', 10000)).toBe(null);

    const metrics = cache.getMetrics();
    expect(metrics.size).toBe(0);
    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(0);
  });

  it('should track cache hits and misses', () => {
    cache.set('key1', { id: '1' });

    cache.get('key1', 10000); // Hit
    cache.get('key1', 10000); // Hit
    cache.get('key2', 10000); // Miss

    const metrics = cache.getMetrics();
    expect(metrics.hits).toBe(2);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRate).toBe('66.67%');
  });

  it('should evict LRU entry when max size exceeded', () => {
    // Mock with small max size
    const smallCache = new LRUCache({ maxSize: 1000 });

    // Add entries until max size exceeded
    smallCache.set('key1', { data: 'a'.repeat(400) });
    smallCache.set('key2', { data: 'b'.repeat(400) });
    smallCache.set('key3', { data: 'c'.repeat(400) }); // Should evict key1

    expect(smallCache.get('key1', 10000)).toBe(null);
    expect(smallCache.get('key2', 10000)).not.toBe(null);
    expect(smallCache.get('key3', 10000)).not.toBe(null);
  });
});
```

---

## 🧪 5. Tests d'Intégration

### Test d'un workflow complet

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOperators, useCreateOperator, useUpdateOperator } from '../../hooks/useResources';
import { operatorService } from '../../services';

describe('Operators workflow', () => {
  it('should create, list, and update operators', async () => {
    // Mock service
    const mockOperators = { data: [], meta: {} };
    const mockCreated = { id: '1', name: 'New Operator', status: 'pending' };
    const mockUpdated = { id: '1', name: 'Updated Operator', status: 'active' };

    jest.spyOn(operatorService, 'getAll').mockResolvedValue(mockOperators);
    jest.spyOn(operatorService, 'create').mockResolvedValue(mockCreated);
    jest.spyOn(operatorService, 'update').mockResolvedValue(mockUpdated);

    // List operators
    const { result: listResult } = renderHook(() => useOperators());
    await waitFor(() => expect(listResult.current.loading).toBe(false));

    // Create operator
    const { result: createResult } = renderHook(() => useCreateOperator());
    await act(async () => {
      await createResult.current.mutate({ name: 'New Operator' });
    });

    expect(createResult.current.data).toEqual(mockCreated);

    // Update operator
    const { result: updateResult } = renderHook(() => useUpdateOperator());
    await act(async () => {
      await updateResult.current.mutate({
        id: '1',
        data: { name: 'Updated Operator', status: 'active' },
      });
    });

    expect(updateResult.current.data).toEqual(mockUpdated);
  });
});
```

---

## 📦 Configuration Jest

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### tests/setup.ts

```typescript
import '@testing-library/jest-dom';
import { ENV } from '../config/env';

// Mock environment
ENV.ENABLE_MOCK_DATA = false;
ENV.API_BASE_URL = 'http://localhost:3000/api';
ENV.CACHE_DURATION = 10000;

// Setup localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Setup console mocks
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

---

## 🎯 Commandes de Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- hooks/useApi.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should fetch data"
```

---

## 📊 Objectifs de Couverture

- **Hooks génériques**: 90%+
- **Hooks métier**: 85%+
- **Services API**: 90%+
- **Cache LRU**: 95%+
- **Intégration**: 80%+

---

## ✅ Checklist de Tests

- [ ] Tests unitaires pour `useApi`
- [ ] Tests unitaires pour `useMutation`
- [ ] Tests unitaires pour `useInvalidateCache`
- [ ] Tests pour tous les hooks métier (43 hooks)
- [ ] Tests pour tous les services (16 services)
- [ ] Tests pour le cache LRU
- [ ] Tests d'intégration pour workflows complets
- [ ] Tests de gestion d'erreurs
- [ ] Tests de retry automatique
- [ ] Tests de token refresh
- [ ] Mocks pour apiClient
- [ ] Configuration Jest complète

---

**🎉 Tests Ready for Implementation!**
