import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TrainingStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TrainingType {
  PILOT_PHASE_I = 'Pilot Phase I',
  PILOT_PHASE_II = 'Pilot Phase II',
  PILOT_PHASE_III = 'Pilot Phase III',
  EDUCATOR_PHASE_I = 'Educator Phase I',
  EDUCATOR_PHASE_II = 'Educator Phase II',
  EDUCATOR_PHASE_III = 'Educator Phase III',
  EDUCATOR_PHASE_IV = 'Educator Phase IV',
}

export class CreateTrainingDto {
  @IsNumber()
  @IsNotEmpty()
  trainer_id: number;

  @IsNumber()
  @IsNotEmpty()
  subject_id: number;

  @IsNumber()
  @IsNotEmpty()
  location_id: number;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  max_participants?: number;

  @IsEnum(TrainingStatus)
  @IsOptional()
  status?: TrainingStatus;

  @IsEnum(TrainingType)
  @IsOptional()
  training_type?: TrainingType;
}

export class UpdateTrainingDto {
  @IsNumber()
  @IsOptional()
  trainer_id?: number;

  @IsNumber()
  @IsOptional()
  subject_id?: number;

  @IsNumber()
  @IsOptional()
  location_id?: number;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  max_participants?: number;

  @IsEnum(TrainingStatus)
  @IsOptional()
  status?: TrainingStatus;

  @IsEnum(TrainingType)
  @IsOptional()
  training_type?: TrainingType;
}

export class TrainingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNumber()
  trainer_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNumber()
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNumber()
  location_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  district_cd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  block_cd?: number;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(TrainingType)
  training_type?: TrainingType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  start_date_from?: string;

  @IsOptional()
  @IsDateString()
  start_date_to?: string;

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
