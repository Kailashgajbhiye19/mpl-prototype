import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumberString,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  // ===============================
  // Location Filters - NAME BASED
  // ===============================
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  block?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  state?: string;

  // ===============================
  // Location Filters - CODE BASED (NEW)
  // ===============================
  @IsOptional()
  @IsNumberString()
  district_cd?: string;

  @IsOptional()
  @IsNumberString()
  block_cd?: string;

  // ===============================
  // Date Filters
  // ===============================
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  // ===============================
  // Date Range Presets
  // ===============================
  @IsOptional()
  @IsIn([
    'last_7_days',
    'last_30_days',
    'last_90_days',
    'this_month',
    'this_year',
  ])
  date_range?:
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
    | 'this_month'
    | 'this_year';

  // ===============================
  // Training Filters
  // ===============================
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  training_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  trainer_id?: number;

  // ===============================
  // Participant Filters
  // ===============================
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

  // ===============================
  // Age Group Filters
  // ===============================
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age_from?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age_to?: number;

  // ===============================
  // Location Extra Filters
  // ===============================
  @IsOptional()
  @IsNumberString()
  pincode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  // ===============================
  // Pagination
  // ===============================
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  // ==============================
  // Sorting
  // ==============================
  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}
