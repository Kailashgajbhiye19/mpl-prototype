// src/modules/file-upload/dto/file-upload.dto.ts
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FileUploadDto {
  @IsString()
  @IsOptional()
  @IsIn(['trainer', 'training', 'training_center', 'participant'])
  type?: string;

  // Multipart form fields arrive as strings; ValidationPipe transforms this to a number.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  reference_id?: number;
}

export class FileDeleteDto {
  @IsString()
  @IsOptional()
  file_url?: string;
}
