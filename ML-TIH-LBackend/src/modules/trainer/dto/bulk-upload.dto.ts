import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class TrainerRowDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  specialization?: string;
}

export class BulkUploadTrainerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainerRowDto)
  trainers: TrainerRowDto[];
}
