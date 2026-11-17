import { UnauthorizedException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('AdminController password ownership', () => {
  const adminService = {
    changePassword: jest
      .fn()
      .mockResolvedValue({ message: 'Password changed successfully' }),
  } as unknown as AdminService;
  const controller = new AdminController(adminService);

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated subject instead of a userId from the request body', async () => {
    await controller.changePassword(
      { user: { sub: 7 } } as never,
      {
        userId: 99,
        currentPassword: 'current',
        newPassword: 'replacement',
      } as ChangePasswordDto,
    );

    expect(adminService.changePassword).toHaveBeenCalledWith(7, {
      userId: 99,
      currentPassword: 'current',
      newPassword: 'replacement',
    });
  });

  it('rejects authenticated requests that do not identify a valid user', async () => {
    await expect(
      controller.changePassword({ user: {} } as never, {
        currentPassword: 'current',
        newPassword: 'replacement',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
