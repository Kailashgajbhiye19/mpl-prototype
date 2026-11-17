import { Injectable } from '@nestjs/common';
import { ReportService } from '../report/report.service';
import { LocationService } from '../location/location.service';
import { TrainingService } from '../training/training.service';
import { LocationQueryDto } from '../location/dto/location.dto';
import { dbPool } from '../../database/db.pool';
import * as fs from 'fs';
import * as path from 'path';
import { getApiBaseUrl } from '../../config/urls';

interface TrainerGalleryRow {
  id: number;
  name: string | null;
  profile_image_url: string;
}

interface TrainingPhotoRow {
  id: number;
  photo_url: string | null;
  training_title: string | null;
}

@Injectable()
export class PublicService {
  private getBaseUrl(): string {
    return getApiBaseUrl();
  }

  constructor(
    private readonly reportService: ReportService,
    private readonly locationService: LocationService,
    private readonly trainingService: TrainingService,
  ) {
    // Automatically ensure trainers & trainings subdirectories exist inside /uploads
    const trainersDir = path.join(process.cwd(), 'uploads', 'trainers');
    const trainingsDir = path.join(process.cwd(), 'uploads', 'trainings');
    if (!fs.existsSync(trainersDir)) {
      fs.mkdirSync(trainersDir, { recursive: true });
    }
    if (!fs.existsSync(trainingsDir)) {
      fs.mkdirSync(trainingsDir, { recursive: true });
    }
  }

  // 🔓 Districts
  async getDistricts() {
    return this.reportService.getDistricts();
  }

  // 🔓 Blocks
  async getBlocks(district_cd: number) {
    return this.reportService.getBlocks(district_cd);
  }

  // 🔓 Locations
  async getLocations(page: number, limit: number) {
    const query: LocationQueryDto = { page, limit };
    return this.locationService.getAllLocations(query);
  }

  // 🔓 Trainings
  async getTrainings() {
    return this.trainingService.getAllTrainings();
  }

  // =========================================================================
  // 🖼️ 🔓 TRAINERS GALLERY API (Choice 1: Separate Endpoint for Trainers)
  // =========================================================================
  async getTrainersGallery(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const galleryItems: Array<{
      id: string | number;
      title: string;
      category: string;
      url: string;
      source: string;
    }> = [];

    // 1. Fetch from Postgres DB (trainers table)
    try {
      const dbResult = await dbPool.query<TrainerGalleryRow>(
        `SELECT id, name, profile_image_url FROM trainers WHERE profile_image_url IS NOT NULL AND profile_image_url != '' ORDER BY id DESC`,
      );

      for (const row of dbResult.rows) {
        let finalUrl = row.profile_image_url;
        if (
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = `${this.getBaseUrl()}/${finalUrl.replace(/^\//, '')}`;
        }
        galleryItems.push({
          id: `db_trainer_${row.id}`,
          title: row.name || 'Trainer',
          category: 'trainers',
          url: finalUrl,
          source: 'database',
        });
      }
    } catch (err) {
      console.warn(
        'Notice: Could not query trainers database table:',
        err instanceof Error ? err.message : String(err),
      );
    }

    // 2. Scan physical uploads/trainer directory
    try {
      const trainersDir = path.join(process.cwd(), 'uploads', 'trainers');
      if (fs.existsSync(trainersDir)) {
        const files = fs.readdirSync(trainersDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            const fileUrl = `${this.getBaseUrl()}/uploads/trainers/${file}`;
            if (!galleryItems.some((item) => item.url === fileUrl)) {
              galleryItems.push({
                id: `file_trainer_${file}`,
                title: file.split('.')[0].replace(/_/g, ' '),
                category: 'trainers',
                url: fileUrl,
                source: 'filesystem',
              });
            }
          }
        }
      }

      // Also scan root uploads folder for trainer_* legacy files
      const rootUploads = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(rootUploads)) {
        const rootFiles = fs.readdirSync(rootUploads);
        for (const file of rootFiles) {
          if (/^trainer_.*\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            const fileUrl = `${this.getBaseUrl()}/uploads/${file}`;
            if (!galleryItems.some((item) => item.url === fileUrl)) {
              galleryItems.push({
                id: `file_trainer_root_${file}`,
                title: file.split('.')[0].replace(/_/g, ' '),
                category: 'trainers',
                url: fileUrl,
                source: 'filesystem',
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        'Notice: Could not read trainers filesystem directory:',
        err instanceof Error ? err.message : String(err),
      );
    }

    const total = galleryItems.length;
    const paginatedItems = galleryItems.slice(offset, offset + limit);

    return {
      success: true,
      category: 'trainers',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginatedItems,
    };
  }

  // =========================================================================
  // 🖼️ 🔓 TRAININGS GALLERY API (Choice 1: Separate Endpoint for Trainings)
  // =========================================================================
  async getTrainingsGallery(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const galleryItems: Array<{
      id: string | number;
      title: string;
      category: string;
      url: string;
      source: string;
    }> = [];

    // 1. Fetch training center photos & participant photos from Postgres DB
    try {
      const centerPhotos = await dbPool.query<TrainingPhotoRow>(
        `SELECT tcp.id, tcp.photo_url, s.name AS training_title 
         FROM training_center_photos tcp 
         LEFT JOIN trainings t ON tcp.training_id = t.id 
         LEFT JOIN subjects s ON t.subject_id = s.id 
         ORDER BY tcp.id DESC`,
      );

      for (const row of centerPhotos.rows) {
        let finalUrl = row.photo_url;
        if (
          finalUrl &&
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = `${this.getBaseUrl()}/${finalUrl.replace(/^\//, '')}`;
        }
        if (finalUrl) {
          galleryItems.push({
            id: `db_center_${row.id}`,
            title: row.training_title || 'Training Center Photo',
            category: 'trainings',
            url: finalUrl,
            source: 'database',
          });
        }
      }

      const participantPhotos = await dbPool.query<TrainingPhotoRow>(
        `SELECT tpp.id, tpp.photo_url, s.name AS training_title 
         FROM training_participant_photos tpp 
         LEFT JOIN trainings t ON tpp.training_id = t.id 
         LEFT JOIN subjects s ON t.subject_id = s.id 
         ORDER BY tpp.id DESC`,
      );

      for (const row of participantPhotos.rows) {
        let finalUrl = row.photo_url;
        if (
          finalUrl &&
          !finalUrl.startsWith('http://') &&
          !finalUrl.startsWith('https://')
        ) {
          finalUrl = `${this.getBaseUrl()}/${finalUrl.replace(/^\//, '')}`;
        }
        if (finalUrl) {
          galleryItems.push({
            id: `db_participant_${row.id}`,
            title: row.training_title || 'Training Participant Photo',
            category: 'trainings',
            url: finalUrl,
            source: 'database',
          });
        }
      }
    } catch (err) {
      console.warn(
        'Notice: Could not query training photos tables:',
        err instanceof Error ? err.message : String(err),
      );
    }

    // 2. Scan physical uploads/training directory
    try {
      const trainingsDir = path.join(process.cwd(), 'uploads', 'training');
      if (fs.existsSync(trainingsDir)) {
        const files = fs.readdirSync(trainingsDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            const fileUrl = `${this.getBaseUrl()}/uploads/training/${file}`;
            if (!galleryItems.some((item) => item.url === fileUrl)) {
              galleryItems.push({
                id: `file_training_${file}`,
                title: file.split('.')[0].replace(/_/g, ' '),
                category: 'trainings',
                url: fileUrl,
                source: 'filesystem',
              });
            }
          }
        }
      }

      // Also scan root uploads directory for training/general photos
      const rootUploads = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(rootUploads)) {
        const rootFiles = fs.readdirSync(rootUploads);
        for (const file of rootFiles) {
          if (
            /^(training|general|participant|location)_.*\.(jpg|jpeg|png|gif|webp)$/i.test(
              file,
            ) ||
            /^\d+\.(jpg|jpeg|png|gif|webp)$/i.test(file)
          ) {
            const fileUrl = `${this.getBaseUrl()}/uploads/${file}`;
            if (!galleryItems.some((item) => item.url === fileUrl)) {
              galleryItems.push({
                id: `file_training_root_${file}`,
                title: file.split('.')[0].replace(/_/g, ' '),
                category: 'trainings',
                url: fileUrl,
                source: 'filesystem',
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        'Notice: Could not read trainings filesystem directory:',
        err instanceof Error ? err.message : String(err),
      );
    }

    const total = galleryItems.length;
    const paginatedItems = galleryItems.slice(offset, offset + limit);

    return {
      success: true,
      category: 'trainings',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginatedItems,
    };
  }

  // =========================================================================
  // 🖼️ 🔓 UNIFIED GALLERY API (Combined option)
  // =========================================================================
  async getCombinedGallery(
    page: number = 1,
    limit: number = 50,
    category?: string,
  ) {
    if (category === 'trainers') {
      return this.getTrainersGallery(page, limit);
    }
    if (category === 'trainings') {
      return this.getTrainingsGallery(page, limit);
    }

    const trainersRes = await this.getTrainersGallery(1, 1000);
    const trainingsRes = await this.getTrainingsGallery(1, 1000);

    const combined = [...trainersRes.data, ...trainingsRes.data];
    const offset = (page - 1) * limit;
    const total = combined.length;
    const paginatedItems = combined.slice(offset, offset + limit);

    return {
      success: true,
      category: 'all',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginatedItems,
    };
  }
}
