import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { dbPool } from '../../database/db.pool';
import { AdminService } from './admin.service';

jest.mock('../../database/db.pool', () => ({ dbPool: { query: jest.fn() } }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

describe('AdminService', () => {
  let service: AdminService;
  let jwt: { sign: jest.Mock };

  beforeEach(() => {
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt') };
    service = new AdminService(jwt as unknown as JwtService);
    jest.clearAllMocks();
  });

  it('rejects weak passwords before database work', async () => {
    await expect(
      service.createAdmin({
        username: 'admin',
        password: 'short',
        name: 'Admin',
        email: 'admin@example.org',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dbPool.query).not.toHaveBeenCalled();
  });

  it('rejects login passwords beyond bcrypt’s byte limit before database work', async () => {
    await expect(
      service.login({ username: 'admin', password: 'é'.repeat(40) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(dbPool.query).not.toHaveBeenCalled();
  });

  it('preserves duplicate account validation errors', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [{ id: 1 }] } as never);

    await expect(
      service.createAdmin({
        username: 'existing',
        password: 'long-enough-password',
        name: 'Admin',
        email: 'admin@example.org',
      }),
    ).rejects.toThrow('Username or email already exists');
  });

  it('stores a bcrypt hash and omits it from the create response', async () => {
    const created = {
      id: 4,
      username: 'admin',
      name: 'Admin',
      email: 'admin@example.org',
      password_hash: 'bcrypt-hash',
    };
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [created] } as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('bcrypt-hash' as never);

    await expect(
      service.createAdmin({
        username: 'admin',
        password: 'long-enough-password',
        name: 'Admin',
        email: 'admin@example.org',
      }),
    ).resolves.toEqual({
      id: 4,
      username: 'admin',
      name: 'Admin',
      email: 'admin@example.org',
    });
    expect(jest.mocked(bcrypt.hash)).toHaveBeenCalledWith(
      'long-enough-password',
      12,
    );
    expect(jest.mocked(dbPool.query).mock.calls[1][1]).toContain('bcrypt-hash');
  });

  it('returns a token for a valid admin login and rejects invalid credentials', async () => {
    jest
      .mocked(dbPool.query)
      .mockResolvedValueOnce({
        rows: [{ id: 1, username: 'admin', password_hash: 'bcrypt-hash' }],
      } as never)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);
    jest
      .mocked(bcrypt.compare)
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never);

    const login = await service.login({
      username: 'admin',
      password: 'correct-password',
    });
    expect(login.token).toBe('signed.jwt');
    expect(login.user).not.toHaveProperty('password_hash');
    await expect(
      service.login({ username: 'admin', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
