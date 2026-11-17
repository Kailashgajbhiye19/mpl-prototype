import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Length,
  IsNumberString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export class CreateParticipantDto {
  @IsNumber()
  @IsNotEmpty()
  training_id: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(120)
  age?: number;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  caste?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  education?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  category?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  attendance_status?: AttendanceStatus;
}

export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @IsNumberString()
  @Length(10, 15)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(120)
  age?: number;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  caste?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  education?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  category?: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  attendance_status?: AttendanceStatus;
}

export class ParticipantQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNumber()
  training_id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  caste?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  attendance_status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  limit?: number;
}
