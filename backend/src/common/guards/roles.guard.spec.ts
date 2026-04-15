import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../constants';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (
    user: { role: UserRole } | null,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  it('should allow when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: UserRole.PASSENGER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when user has the required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.PASSENGER });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user on request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
