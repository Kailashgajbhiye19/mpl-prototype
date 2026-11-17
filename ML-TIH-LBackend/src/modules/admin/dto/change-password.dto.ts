import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Username of the user (required for public password change)',
    required: false,
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Current password of the user',
    example: 'OldPass@123',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'NewPass@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(72)
  newPassword: string;
}
