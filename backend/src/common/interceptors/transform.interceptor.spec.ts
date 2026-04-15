import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  const mockExecutionContext = {} as ExecutionContext;

  it('should wrap data in standard response', (done) => {
    const mockCallHandler: CallHandler = {
      handle: () => of({ id: 1, name: 'Test' }),
    };

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1, name: 'Test' });
        expect(result.timestamp).toBeDefined();
        done();
      });
  });

  it('should wrap null data', (done) => {
    const mockCallHandler: CallHandler = {
      handle: () => of(null),
    };

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
        done();
      });
  });

  it('should wrap array data', (done) => {
    const mockCallHandler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual([1, 2, 3]);
        done();
      });
  });
});
