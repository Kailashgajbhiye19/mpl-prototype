import { Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength, MaxLength } from 'class-validator';

export class AdminResetPasswordDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsString()
  @MinLength(12)
  @MaxLength(72)
  newPassword: string;
}
