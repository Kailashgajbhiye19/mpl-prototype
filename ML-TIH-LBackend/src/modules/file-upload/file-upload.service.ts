// src/modules/file-upload/file-upload.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FileUploadDto } from './dto/file-upload.dto';
import {
  FileUploadResponse,
  FileUploadConfig,
} from './interfaces/file-upload.interface';
import { dbPool } from '../../database/db.pool';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  extensionForMimeType,
  validateFileSignature,
} from '../../utils/uploaded-file.util';
import { getApiBaseUrl } from '../../config/urls';

@Injectable()
export class FileUploadService {
  private readonly config: FileUploadConfig = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    uploadPath: './uploads',
    maxFiles: 10,
  };

  constructor() {
    if (!fs.existsSync(this.config.uploadPath)) {
      fs.mkdirSync(this.config.uploadPath, { recursive: true });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.config.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${this.config.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`,
      );
    }
    validateFileSignature(file.mimetype, file.buffer);
  }

  private generateUniqueFilename(
    originalName: string,
    type: string | undefined,
    mimeType: string,
  ): string {
    const normalizedName = originalName.replace(/\\/g, '/');
    const extension = extensionForMimeType(mimeType);
    const baseName =
      path
        .basename(normalizedName, extension)
        .replace(/[^a-z0-9_-]/gi, '_')
        .slice(0, 80) || 'upload';
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');

    const safeType = [
      'trainer',
      'training',
      'training_center',
      'participant',
    ].includes(type || '')
      ? type
      : 'general';
    return `${safeType}_${baseName}_${timestamp}_${randomString}${extension}`;
  }

  private getUploadPath(type?: string): { directory: string; urlPath: string } {
    const folder =
      type === 'trainer'
        ? 'trainer'
        : ['training', 'training_center', 'participant'].includes(type || '')
          ? 'training'
          : '';

    return {
      directory: folder
        ? path.join(this.config.uploadPath, folder)
        : this.config.uploadPath,
      urlPath: folder ? `${folder}/` : '',
    };
  }

  private resolveUploadPath(relativePath: string): string {
    const uploadRoot = path.resolve(this.config.uploadPath);
    const resolvedPath = path.resolve(uploadRoot, relativePath);
    if (!resolvedPath.startsWith(`${uploadRoot}${path.sep}`)) {
      throw new BadRequestException('Invalid file path');
    }
    return resolvedPath;
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: FileUploadDto,
  ): Promise<FileUploadResponse> {
    try {
      if (
        uploadDto.type &&
        !['trainer', 'training', 'training_center', 'participant'].includes(
          uploadDto.type,
        )
      ) {
        throw new BadRequestException('Upload type is not allowed');
      }
      this.validateFile(file);

      const uniqueFilename = this.generateUniqueFilename(
        file.originalname,
        uploadDto.type,
        file.mimetype,
      );
      const uploadLocation = this.getUploadPath(uploadDto.type);
      if (!fs.existsSync(uploadLocation.directory)) {
        fs.mkdirSync(uploadLocation.directory, { recursive: true });
      }
      const filePath = path.join(uploadLocation.directory, uniqueFilename);

      fs.writeFileSync(filePath, file.buffer);

      const fileUrl = `${getApiBaseUrl()}/uploads/${uploadLocation.urlPath}${uniqueFilename}`;

      const response: FileUploadResponse = {
        file_url: fileUrl,
        file_name: uniqueFilename,
        file_size: file.size,
        file_type: file.mimetype,
        reference_id: uploadDto.reference_id,
        type: uploadDto.type,
        uploaded_at: new Date(),
      };

      // Automatically save to database table based on type
      if (uploadDto.type && uploadDto.reference_id) {
        await this.saveToDatabase(
          uploadDto.type,
          uploadDto.reference_id,
          fileUrl,
        );
      }

      return response;
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadDto: FileUploadDto,
  ): Promise<FileUploadResponse[]> {
    try {
      if (files.length > this.config.maxFiles) {
        throw new BadRequestException(
          `Maximum ${this.config.maxFiles} files allowed`,
        );
      }

      const results: FileUploadResponse[] = [];
      for (const file of files) {
        const result = await this.uploadFile(file, uploadDto);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Multiple file upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload files');
    }
  }

  private async saveToDatabase(
    type: string,
    referenceId: number,
    photoUrl: string,
  ): Promise<void> {
    try {
      if (type === 'training_center') {
        // referenceId is training_id
        await dbPool.query(
          'INSERT INTO training_center_photos (training_id, photo_url, uploaded_at) VALUES ($1, $2, NOW())',
          [referenceId, photoUrl],
        );
      } else if (type === 'participant') {
        // referenceId is participant_id, fetch training_id
        const participantResult = await dbPool.query<{ training_id: number }>(
          'SELECT training_id FROM participants WHERE id = $1',
          [referenceId],
        );
        if (participantResult.rows.length === 0) {
          throw new NotFoundException('Participant not found');
        }
        const trainingId = participantResult.rows[0].training_id;

        await dbPool.query(
          'INSERT INTO training_participant_photos (participant_id, training_id, photo_url, uploaded_at) VALUES ($1, $2, $3, NOW())',
          [referenceId, trainingId, photoUrl],
        );
      }
      // Add more types if needed in future
    } catch (error) {
      console.error('Save to database error:', error);
      // Don't throw to avoid failing the upload, but log it
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) throw new BadRequestException('File URL is required');
      const apiBaseUrl = getApiBaseUrl();
      const baseUrl = new URL(apiBaseUrl);
      const suppliedUrl = new URL(fileUrl, baseUrl);
      if (suppliedUrl.origin !== baseUrl.origin) {
        throw new BadRequestException(
          'File URL must belong to this application',
        );
      }

      const uploadMarker = '/uploads/';
      const markerIndex = suppliedUrl.pathname.indexOf(uploadMarker);
      if (markerIndex < 0) throw new BadRequestException('Invalid upload URL');
      const relativePath = decodeURIComponent(
        suppliedUrl.pathname.slice(markerIndex + uploadMarker.length),
      );
      if (relativePath.split(/[\\/]/).some((segment) => segment === '..')) {
        throw new BadRequestException('Invalid file path');
      }
      const filePath = this.resolveUploadPath(relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove from photo tables
      await dbPool.query(
        'DELETE FROM training_center_photos WHERE photo_url = $1',
        [fileUrl],
      );
      await dbPool.query(
        'DELETE FROM training_participant_photos WHERE photo_url = $1',
        [fileUrl],
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('File delete error:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async getFile(filename: string): Promise<Buffer> {
    try {
      if (!filename || filename !== path.basename(filename)) {
        throw new BadRequestException('Invalid file name');
      }
      const filePath = this.resolveUploadPath(filename);

      try {
        await fs.promises.access(filePath);
      } catch {
        throw new NotFoundException('File not found');
      }

      return await fs.promises.readFile(filePath);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Get file error:', error);
      throw new InternalServerErrorException('Failed to retrieve file');
    }
  }
}
