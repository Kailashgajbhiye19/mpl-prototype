import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
  IsNumberString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrainerDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  bio?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;
}

export class UpdateTrainerDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  bio?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;
}

export class TrainerQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  block?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
