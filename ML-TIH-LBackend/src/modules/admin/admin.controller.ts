import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';
import { AdminCreateDto } from './dto/admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AuthGuard } from '../../utils/auth.guard';
import type { AuthenticatedRequest } from '../../utils/auth.guard';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================
  // LOGIN
  // ============================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin Login',
    description:
      'Login to the system with username and password. Returns JWT token.',
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return await this.adminService.login(loginDto);
  }

  // ============================
  // CREATE ADMIN
  // ============================
  @Post('create')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new admin',
    description:
      'Create a new admin user. Requires an authenticated administrator.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: AdminCreateDto })
  async createAdmin(@Body() createDto: AdminCreateDto) {
    return await this.adminService.createAdmin(createDto);
  }

  // ============================
  // GET ALL ADMINS
  // ============================
  @Get('all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admins' })
  async getAllAdmins() {
    return await this.adminService.getAllAdmins();
  }

  // ============================
  // GET ADMIN BY ID
  // ============================
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Get admin by ID' })
  async getAdminById(@Param('id') id: number) {
    return await this.adminService.getAdminById(id);
  }

  // ============================
  // ✅ ADMIN RESET PASSWORD (NO EMAIL, NO OLD PASSWORD)
  // ============================
  @Post('reset-user-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin reset user password',
    description:
      'An authenticated administrator can reset an account password.',
  })
  @ApiBody({ type: AdminResetPasswordDto })
  async adminResetPassword(@Body() body: AdminResetPasswordDto) {
    return await this.adminService.adminResetPassword(
      body.userId,
      body.newPassword,
    );
  }

  // ============================
  // ✅ USER CHANGE PASSWORD (REQUIRES CURRENT PASSWORD)
  // ============================
  @Post('change-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Allows logged in user to change their password by verifying current password',
  })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = Number(req.user?.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      throw new UnauthorizedException('Invalid authenticated user');
    }
    return await this.adminService.changePassword(userId, changePasswordDto);
  }

  // ============================
  // ✅ PUBLIC CHANGE PASSWORD (UNAUTHENTICATED)
  // ============================
  @Post('change-password-public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public change user password from login page',
    description:
      'Allows unauthenticated users to change their password by validating username and current password',
  })
  @ApiBody({ type: ChangePasswordDto })
  async changePasswordPublic(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.adminService.changePasswordPublic(changePasswordDto);
  }

  // ============================
}
