import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationDto {
  @IsString()
  @IsOptional()
  @Length(0, 100)
  village?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  block?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  district?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  state?: string;

  @IsString()
  @IsOptional()
  @Length(6, 6)
  pincode?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  address_line?: string;

  @IsNumber()
  @IsOptional()
  district_cd?: number;

  @IsNumber()
  @IsOptional()
  block_cd?: number;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  @Length(0, 100)
  village?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  block?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  district?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  state?: string;

  @IsString()
  @IsOptional()
  @Length(6, 6)
  pincode?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  address_line?: string;

  @IsNumber()
  @IsOptional()
  district_cd?: number;

  @IsNumber()
  @IsOptional()
  block_cd?: number;
}

export class LocationQueryDto {
  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  block?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNumber()
  district_cd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNumber()
  block_cd?: number;

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
