import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AdminCreateDto } from './dto/admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { dbPool } from '../../database/db.pool';
import bcrypt from 'bcrypt';
import {
  AdminCredentials,
  AdminPasswordRecord,
  AdminUser,
} from './interface/admin.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(private readonly jwtService: JwtService) {}

  private assertPasswordCanBeHashed(password: string): void {
    if (password.length < 12) {
      throw new BadRequestException(
        'Password must be at least 12 characters long',
      );
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
    }
  }

  // ============================
  // LOGIN

  async login(loginDto: LoginDto): Promise<{ token: string; user: AdminUser }> {
    const { username, password } = loginDto;
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new UnauthorizedException('Login failed');
    }

    try {
      const result = await dbPool.query<AdminCredentials>(
        'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
        [username],
      );

      if (result.rows.length === 0) {
        throw new UnauthorizedException('Invalid username');
      }

      const admin = result.rows[0];

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      await dbPool.query(
        'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
        [admin.id],
      );

      const payload = {
        sub: admin.id,
        username: admin.username,
        email: admin.email,
        role: 'admin',
      };

      const token = this.jwtService.sign(payload);
      const user: AdminUser = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        created_at: admin.created_at,
        last_login: admin.last_login,
        is_active: admin.is_active,
      };
      return { token, user };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        console.error('Login error:', error);
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  // ============================
  // CREATE ADMIN
  // ============================
  async createAdmin(createDto: AdminCreateDto): Promise<AdminUser> {
    const { username, password, name, email } = createDto;
    this.assertPasswordCanBeHashed(password);

    try {
      const existingUser = await dbPool.query<{ id: number }>(
        'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
        [username, email],
      );

      if (existingUser.rows.length > 0) {
        throw new BadRequestException('Username or email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await dbPool.query<AdminUser>(
        `INSERT INTO admin_users (username, password_hash, name, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, name, email, created_at, last_login, is_active`,
        [username, hashedPassword, name, email],
      );

      const createdAdmin = result.rows[0];
      return {
        id: createdAdmin.id,
        username: createdAdmin.username,
        name: createdAdmin.name,
        email: createdAdmin.email,
        created_at: createdAdmin.created_at,
        last_login: createdAdmin.last_login,
        is_active: createdAdmin.is_active,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Create admin error:', error);
      throw new BadRequestException('Failed to create admin');
    }
  }

  // ============================
  // GET ALL ADMINS
  // ============================
  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const result = await dbPool.query<AdminUser>(
        `SELECT id, username, name, email, created_at, last_login, is_active
         FROM admin_users
         ORDER BY created_at DESC`,
      );

      return result.rows;
    } catch (error) {
      console.error('Get all admins error:', error);
      throw new BadRequestException('Failed to fetch admins');
    }
  }

  // ============================
  // GET ADMIN BY ID
  // ============================
  async getAdminById(id: number): Promise<AdminUser> {
    try {
      const result = await dbPool.query<AdminUser>(
        `SELECT id, username, name, email, created_at, last_login, is_active
         FROM admin_users
         WHERE id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Admin not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get admin by ID error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch admin');
    }
  }

  // ============================
  // ✅ ADMIN RESET PASSWORD (NO EMAIL, NO OLD PASSWORD)
  // ============================
  async adminResetPassword(
    userId: number,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.assertPasswordCanBeHashed(newPassword);
    // 1. Check user exists
    const result = await dbPool.query<{ id: number }>(
      'SELECT id FROM admin_users WHERE id = $1 AND is_active = true',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update password
    await dbPool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId],
    );

    return { message: 'Password reset successfully by admin' };
  }

  // ============================
  // ✅ USER CHANGE PASSWORD (WITH CURRENT PASSWORD VERIFICATION)
  // ============================
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    if (!currentPassword || !newPassword) {
      throw new BadRequestException(
        'Current password and new password are required',
      );
    }

    this.assertPasswordCanBeHashed(newPassword);

    // 1. Fetch user from DB with password_hash
    const result = await dbPool.query<AdminPasswordRecord>(
      'SELECT id, password_hash FROM admin_users WHERE id = $1 AND is_active = true',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];

    // 2. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // 3. Hash new password & update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbPool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId],
    );

    return { message: 'Password changed successfully' };
  }

  // ============================
  // ✅ PUBLIC CHANGE PASSWORD (FOR UNAUTHENTICATED USERS ON LOGIN PAGE)
  // ============================
  async changePasswordPublic(
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { username, currentPassword, newPassword } = dto;

    if (!username || !currentPassword || !newPassword) {
      throw new BadRequestException(
        'Username, current password, and new password are required',
      );
    }

    this.assertPasswordCanBeHashed(newPassword);

    // 1. Fetch user by username
    const result = await dbPool.query<AdminPasswordRecord>(
      'SELECT id, password_hash FROM admin_users WHERE username = $1 AND is_active = true',
      [username],
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Invalid username or current password');
    }

    const user = result.rows[0];

    // 2. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Invalid username or current password');
    }

    // 3. Hash new password & update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbPool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, user.id],
    );

    return {
      message:
        'Password changed successfully. You can now login with your new password.',
    };
  }
}
