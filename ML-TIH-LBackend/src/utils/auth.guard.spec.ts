import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, AdminJwtPayload } from './auth.guard';

describe('AuthGuard', () => {
  type VerifyOptions = NonNullable<Parameters<JwtService['verify']>[1]>;
  const verify = jest.fn<AdminJwtPayload, [string, VerifyOptions]>();
  const jwtService = { verify } as unknown as JwtService;
  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtService);
  });

  const contextFor = (authorization?: string) => {
    const request: {
      headers: { authorization?: string };
      user?: AdminJwtPayload;
    } = { headers: { authorization } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { request, context };
  };

  it('returns 401 when the authorization header is missing', () => {
    const { context } = contextFor();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('verifies bearer tokens and attaches the authenticated user', () => {
    const { context, request } = contextFor('Bearer valid-token');
    const user: AdminJwtPayload = {
      sub: 7,
      username: 'admin',
      email: 'admin@example.org',
      role: 'admin',
    };
    verify.mockReturnValue(user);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual(user);
  });

  it('returns 401 for invalid or expired tokens', () => {
    const { context } = contextFor('Bearer invalid-token');
    verify.mockImplementation(() => {
      throw new Error('expired');
    });

    expect(() => guard.canActivate(context)).toThrow(
      'Invalid or expired token',
    );
  });
});
