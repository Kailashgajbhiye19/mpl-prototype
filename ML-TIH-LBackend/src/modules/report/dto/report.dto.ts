import { IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsInt()
  @Min(0)
  district_cd?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsInt()
  @Min(0)
  block_cd?: number;

  @IsOptional()
  from_date?: string; // YYYY-MM-DD format

  @IsOptional()
  to_date?: string; // YYYY-MM-DD format
}
