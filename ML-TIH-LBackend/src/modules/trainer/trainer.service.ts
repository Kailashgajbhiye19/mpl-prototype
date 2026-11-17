import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerQueryDto,
} from './dto/trainer.dto';
import { dbPool } from '../../database/db.pool';
import { Trainer } from './interfaces/trainer.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  extensionForMimeType,
  validateFileSignature,
} from '../../utils/uploaded-file.util';
import { getApiBaseUrl } from '../../config/urls';

export interface TrainerPhotoUploadResult {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  reference_id: number;
  type: 'trainer';
  uploaded_at: Date;
}

@Injectable()
export class TrainerService {
  // =====================================================
  // CREATE TRAINER WITH IMAGE (NEW – DOES NOT BREAK OLD)
  // =====================================================
  async createTrainerWithImage(
    createDto: CreateTrainerDto,
    file?: Express.Multer.File,
  ): Promise<Trainer> {
    const { name, phone, email, bio } = createDto;

    try {
      // Duplicate checks (same as old createTrainer)
      if (phone) {
        const existingPhone = await dbPool.query<{ id: number }>(
          'SELECT id FROM trainers WHERE phone = $1',
          [phone],
        );
        if (existingPhone.rows.length > 0) {
          throw new BadRequestException('Phone number already exists');
        }
      }

      if (email) {
        const existingEmail = await dbPool.query<{ id: number }>(
          'SELECT id FROM trainers WHERE email = $1',
          [email],
        );
        if (existingEmail.rows.length > 0) {
          throw new BadRequestException('Email already exists');
        }
      }

      // Handle image (optional)
      let profileImageUrl: string | null = null;

      if (file) {
        this.validateFile(file);

        const uniqueFilename = this.generateUniqueFilename(
          file.originalname,
          'trainer',
          file.mimetype,
        );

        const uploadPath = path.join(process.cwd(), 'uploads', 'trainer');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        fs.writeFileSync(path.join(uploadPath, uniqueFilename), file.buffer);

        profileImageUrl = `${getApiBaseUrl()}/uploads/trainer/${uniqueFilename}`;
      }

      // Insert trainer
      const result = await dbPool.query<Trainer>(
        `INSERT INTO trainers (name, phone, email, bio, profile_image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, phone, email, bio, profileImageUrl],
      );

      return result.rows[0];
    } catch (error) {
      console.error('Create trainer with image error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create trainer');
    }
  }

  // =====================================================
  // UPLOAD TRAINER PHOTO (EXISTING – UNCHANGED)
  // =====================================================
  async uploadTrainerPhoto(
    trainerId: number,
    file: Express.Multer.File,
  ): Promise<TrainerPhotoUploadResult> {
    try {
      const trainerCheck = await dbPool.query(
        'SELECT id FROM trainers WHERE id = $1',
        [trainerId],
      );
      if (trainerCheck.rows.length === 0) {
        throw new NotFoundException('Trainer not found');
      }

      this.validateFile(file);

      const uniqueFilename = this.generateUniqueFilename(
        file.originalname,
        'trainer',
        file.mimetype,
      );
      const uploadPath = path.join(process.cwd(), 'uploads', 'trainer');

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const filePath = path.join(uploadPath, uniqueFilename);
      fs.writeFileSync(filePath, file.buffer);

      const fileUrl = `${getApiBaseUrl()}/uploads/trainer/${uniqueFilename}`;

      await dbPool.query(
        'UPDATE trainers SET profile_image_url = $1 WHERE id = $2',
        [fileUrl, trainerId],
      );

      return {
        file_url: fileUrl,
        file_name: uniqueFilename,
        file_size: file.size,
        file_type: file.mimetype,
        reference_id: trainerId,
        type: 'trainer',
        uploaded_at: new Date(),
      };
    } catch (error) {
      console.error('Upload trainer photo error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to upload trainer photo');
    }
  }

  // =====================================================
  // VALIDATE FILE (EXISTING – UNCHANGED)
  // =====================================================
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    validateFileSignature(file.mimetype, file.buffer);
  }

  // =====================================================
  // GENERATE UNIQUE FILENAME (UNCHANGED)
  // =====================================================
  private generateUniqueFilename(
    originalName: string,
    prefix: string,
    mimeType: string,
  ): string {
    const normalizedName = originalName.replace(/\\/g, '/');
    const extension = extensionForMimeType(mimeType);
    const baseName =
      path
        .basename(normalizedName, path.extname(normalizedName))
        .replace(/[^a-z0-9_-]/gi, '_')
        .slice(0, 80) || 'image';
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${baseName}_${timestamp}_${randomString}${extension}`;
  }

  // =====================================================
  // CREATE TRAINER (OLD – UNCHANGED)
  // =====================================================
  async createTrainer(createDto: CreateTrainerDto): Promise<Trainer> {
    const { name, phone, email, bio, profile_image_url } = createDto;

    try {
      if (phone) {
        const existingPhone = await dbPool.query<{ id: number }>(
          'SELECT id FROM trainers WHERE phone = $1',
          [phone],
        );
        if (existingPhone.rows.length > 0) {
          throw new BadRequestException('Phone number already exists');
        }
      }

      if (email) {
        const existingEmail = await dbPool.query<{ id: number }>(
          'SELECT id FROM trainers WHERE email = $1',
          [email],
        );
        if (existingEmail.rows.length > 0) {
          throw new BadRequestException('Email already exists');
        }
      }

      const result = await dbPool.query<Trainer>(
        `INSERT INTO trainers (name, phone, email, bio, profile_image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, phone, email, bio, profile_image_url],
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Create trainer error:', error);
      throw new BadRequestException('Failed to create trainer');
    }
  }

  // =====================================================
  // GET / UPDATE / DELETE (ALL UNCHANGED)
  // =====================================================
  // async getAllTrainers(queryDto: TrainerQueryDto = {}): Promise<Trainer[]> {
  //   const { search, page = 1, limit = 10 } = queryDto;

  //   let query = `SELECT * FROM trainers WHERE 1=1`;
  //   const params: any[] = [];
  //   let paramCount = 0;

  //   if (search) {
  //     paramCount++;
  //     query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
  //     params.push(`%${search}%`);
  //   }

  //   query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  //   params.push(limit, (page - 1) * limit);

  //   const result = await dbPool.query(query, params);
  //   return result.rows;
  // }

  async getAllTrainers(queryDto: TrainerQueryDto = {}): Promise<Trainer[]> {
    const { search, page = 1, limit = 10 } = queryDto;

    let query = `SELECT * FROM trainers WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, (page - 1) * limit);

    const result = await dbPool.query<Trainer>(query, params);

    return result.rows;
  }

  async getTrainerById(id: number): Promise<Trainer> {
    const result = await dbPool.query<Trainer>(
      'SELECT * FROM trainers WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Trainer not found');
    }

    return result.rows[0];
  }

  async updateTrainer(
    id: number,
    updateDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        params.push(value);
      }
    }

    if (!updates.length) {
      return this.getTrainerById(id);
    }

    paramCount++;
    params.push(id);

    const result = await dbPool.query<Trainer>(
      `UPDATE trainers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params,
    );

    if (!result.rows.length) {
      throw new NotFoundException('Trainer not found');
    }

    return result.rows[0];
  }

  async deleteTrainer(id: number): Promise<void> {
    const result = await dbPool.query<{ id: number }>(
      'DELETE FROM trainers WHERE id = $1 RETURNING id',
      [id],
    );

    if (!result.rows.length) {
      throw new NotFoundException('Trainer not found');
    }
  }
}
