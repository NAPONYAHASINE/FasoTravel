import { HttpExceptionFilter } from './http-exception.filter';
import {
  HttpStatus,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test' }),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () =>
        ({}) as unknown as ReturnType<ArgumentsHost['switchToRpc']>,
      switchToWs: () =>
        ({}) as unknown as ReturnType<ArgumentsHost['switchToWs']>,
      getType: () => 'http' as const,
    } as unknown as ArgumentsHost;
  });

  it('should handle BadRequestException (400)', () => {
    const exception = new BadRequestException(['field must be valid']);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 400,
        }),
      }),
    );
  });

  it('should handle UnauthorizedException (401)', () => {
    const exception = new UnauthorizedException('Invalid token');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 401,
        }),
      }),
    );
  });

  it('should handle NotFoundException (404)', () => {
    const exception = new NotFoundException('Resource not found');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 404,
        }),
      }),
    );
  });

  it('should handle unknown errors as 500', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 500,
        }),
      }),
    );
  });
});
