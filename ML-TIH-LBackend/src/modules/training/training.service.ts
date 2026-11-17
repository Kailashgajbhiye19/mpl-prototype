import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTrainingDto,
  UpdateTrainingDto,
  TrainingQueryDto,
  TrainingStatus,
} from './dto/training.dto';
import { dbPool } from '../../database/db.pool';
import { Training, TrainingWithNames } from './interfaces/training.interface';

type QueryValue = string | number | Date | null;

type TrainingRow = Omit<
  Training,
  'status' | 'start_date' | 'end_date' | 'training_type'
> & {
  status: string;
  start_date: Date;
  end_date: Date | null;
  training_type: string | null;
};

interface TrainingQueryRow extends TrainingRow {
  trainer_name: string | null;
  trainer_profile_image: string | null;
  subject_name: string | null;
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  district_cd: number | null;
  block_cd: number | null;
  latitude: number | null;
  longitude: number | null;
  address_line: string | null;
  total_participants: number;
}

@Injectable()
export class TrainingService {
  // ================= CREATE TRAINING =================
  async createTraining(createDto: CreateTrainingDto): Promise<Training> {
    const {
      trainer_id,
      subject_id,
      location_id,
      start_date,
      end_date,
      max_participants = 50,
      status = TrainingStatus.SCHEDULED,
      training_type,
    } = createDto;

    try {
      let startDateObj: Date;
      let endDateObj: Date | null = null;

      try {
        startDateObj = new Date(start_date);
        if (isNaN(startDateObj.getTime())) {
          throw new BadRequestException('Invalid start_date format');
        }

        if (end_date) {
          endDateObj = new Date(end_date);
          if (isNaN(endDateObj.getTime())) {
            throw new BadRequestException('Invalid end_date format');
          }
        }
      } catch {
        throw new BadRequestException(
          'Invalid date format. Use ISO format like "2025-06-27T09:00:00Z"',
        );
      }

      const [trainerCheck, subjectCheck, locationCheck] = await Promise.all([
        dbPool.query<{ id: number }>('SELECT id FROM trainers WHERE id = $1', [
          trainer_id,
        ]),
        dbPool.query<{ id: number }>('SELECT id FROM subjects WHERE id = $1', [
          subject_id,
        ]),
        dbPool.query<{ id: number }>('SELECT id FROM locations WHERE id = $1', [
          location_id,
        ]),
      ]);

      if (!trainerCheck.rows.length)
        throw new BadRequestException('Trainer not found');
      if (!subjectCheck.rows.length)
        throw new BadRequestException('Subject not found');
      if (!locationCheck.rows.length)
        throw new BadRequestException('Location not found');

      const result = await dbPool.query<Training>(
        `INSERT INTO trainings
         (trainer_id, subject_id, location_id, start_date, end_date, max_participants, status, training_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          trainer_id,
          subject_id,
          location_id,
          startDateObj,
          endDateObj,
          max_participants,
          status,
          training_type || null,
        ],
      );

      return result.rows[0];
    } catch (error) {
      console.error('Create training error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create training');
    }
  }

  async getAllTrainings(
    queryDto: TrainingQueryDto = {},
  ): Promise<TrainingWithNames[]> {
    const {
      trainer_id,
      subject_id,
      location_id,
      district_cd,
      block_cd,
      village,
      subject,
      training_type,
      status,
      start_date_from,
      start_date_to,
      page = 1,
      limit = 10,
    } = queryDto;

    // COALESCE(p.participant_count, 0) AS total_participants]
    //  LEFT JOIN (
    //       SELECT training_id, COUNT(*) AS participant_count
    //       FROM participants
    //       GROUP BY training_id
    //     ) p ON t.id = p.training_id

    try {
      let query = `
        SELECT
          t.*,
          tr.name AS trainer_name,
          tr.profile_image_url AS trainer_profile_image,
          s.name AS subject_name,
          l.village,
          l.block,
          l.district,
          l.state,
          l.district_cd,
          l.block_cd,
          l.latitude,
          l.longitude,
          l.address_line,
          COALESCE(t.actual_participants, 0) AS total_participants
        FROM trainings t
        LEFT JOIN trainers tr ON t.trainer_id = tr.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE 1=1
      `;

      const params: QueryValue[] = [];
      let paramCount = 0;

      if (trainer_id) {
        params.push(trainer_id);
        query += ` AND t.trainer_id = $${++paramCount}`;
      }
      if (subject_id) {
        params.push(subject_id);
        query += ` AND t.subject_id = $${++paramCount}`;
      }
      if (location_id) {
        params.push(location_id);
        query += ` AND t.location_id = $${++paramCount}`;
      }
      if (district_cd !== undefined) {
        params.push(district_cd);
        query += ` AND l.district_cd = $${++paramCount}`;
      }
      if (block_cd !== undefined) {
        params.push(block_cd);
        query += ` AND l.block_cd = $${++paramCount}`;
      }
      if (village) {
        params.push(village);
        query += ` AND l.village ILIKE $${++paramCount}`;
        params[paramCount - 1] = `%${village}%`;
      }
      if (subject) {
        params.push(subject);
        query += ` AND s.name ILIKE $${++paramCount}`;
        params[paramCount - 1] = `%${subject}%`;
      }
      if (training_type) {
        params.push(training_type);
        query += ` AND t.training_type = $${++paramCount}`;
      }
      if (status) {
        params.push(status);
        query += ` AND t.status = $${++paramCount}`;
      }
      if (start_date_from) {
        params.push(new Date(start_date_from));
        query += ` AND t.start_date >= $${++paramCount}`;
      }
      if (start_date_to) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(start_date_to)) {
          params.push(start_date_to);
          query += ` AND t.start_date < ($${++paramCount}::date + INTERVAL '1 day')`;
        } else {
          params.push(new Date(start_date_to));
          query += ` AND t.start_date <= $${++paramCount}`;
        }
      }

      query += ` ORDER BY t.start_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(+limit, (+page - 1) * +limit);

      const result = await dbPool.query<TrainingQueryRow>(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        trainer_id: row.trainer_id,
        subject_id: row.subject_id,
        location_id: row.location_id,
        start_date: row.start_date,
        end_date: row.end_date,
        max_participants: row.max_participants,
        actual_participants: row.actual_participants,
        status: row.status,
        training_type: row.training_type ?? null,
        created_at: row.created_at,

        trainer_name: row.trainer_name,
        trainer_profile_image: row.trainer_profile_image,

        subject_name: row.subject_name,
        location_details: {
          village: row.village,
          block: row.block,
          district: row.district,
          state: row.state,
          district_cd: row.district_cd,
          block_cd: row.block_cd,
          latitude: row.latitude,
          longitude: row.longitude,
          address_line: row.address_line,
        },
        total_participants: row.total_participants,
      }));
    } catch (error) {
      console.error('Get all trainings error:', error);
      throw new BadRequestException('Failed to fetch trainings');
    }
  }

  // ================= GET TRAINING BY ID =================
  //COALESCE(p.participant_count, 0) AS total_participants
  // LEFT JOIN (
  //         SELECT training_id, COUNT(*) AS participant_count
  //         FROM participants
  //         GROUP BY training_id
  //       ) p ON t.id = p.training_id

  async getTrainingById(id: number): Promise<TrainingWithNames> {
    try {
      const result = await dbPool.query<TrainingQueryRow>(
        `
        SELECT
          t.*,
          tr.name AS trainer_name,
          tr.profile_image_url AS trainer_profile_image,
          s.name AS subject_name,
          l.village,
          l.block,
          l.district,
          l.state,
          l.latitude,
          l.longitude,
          l.address_line,
          COALESCE(t.actual_participants, 0) AS total_participants
        FROM trainings t
        LEFT JOIN trainers tr ON t.trainer_id = tr.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE t.id = $1
      `,
        [id],
      );

      if (!result.rows.length) {
        throw new NotFoundException('Training not found');
      }

      const row = result.rows[0];

      return {
        id: row.id,
        trainer_id: row.trainer_id,
        subject_id: row.subject_id,
        location_id: row.location_id,
        start_date: row.start_date,
        end_date: row.end_date,
        max_participants: row.max_participants,
        actual_participants: row.actual_participants,
        status: row.status,
        training_type: row.training_type ?? null,
        created_at: row.created_at,

        trainer_name: row.trainer_name,
        trainer_profile_image: row.trainer_profile_image,

        subject_name: row.subject_name,
        location_details: {
          village: row.village,
          block: row.block,
          district: row.district,
          state: row.state,
          latitude: row.latitude,
          longitude: row.longitude,
          address_line: row.address_line,
        },
        total_participants: row.total_participants,
      };
    } catch (error) {
      console.error('Get training by ID error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch training');
    }
  }

  // ================= DETAILS (REUSED) =================
  async getTrainingWithDetails(id: number): Promise<TrainingWithNames> {
    return this.getTrainingById(id);
  }

  // ================= UPDATE TRAINING =================
  async updateTraining(
    id: number,
    updateDto: UpdateTrainingDto,
  ): Promise<Training> {
    try {
      const updates: string[] = [];
      const params: QueryValue[] = [];
      let paramCount = 0;

      const editableColumns: Array<[keyof UpdateTrainingDto, string]> = [
        ['trainer_id', 'trainer_id'],
        ['subject_id', 'subject_id'],
        ['location_id', 'location_id'],
        ['start_date', 'start_date'],
        ['end_date', 'end_date'],
        ['max_participants', 'max_participants'],
        ['status', 'status'],
        ['training_type', 'training_type'],
      ];

      for (const [key, column] of editableColumns) {
        const value = updateDto[key];
        if (value !== undefined) {
          params.push(value);
          updates.push(`${column} = $${++paramCount}`);
        }
      }

      if (!updates.length) {
        throw new BadRequestException('No fields to update');
      }

      params.push(id);
      const result = await dbPool.query<Training>(
        `UPDATE trainings SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
        params,
      );

      if (!result.rows.length)
        throw new NotFoundException('Training not found');
      return result.rows[0];
    } catch (error) {
      console.error('Update training error:', error);
      throw error;
    }
  }

  // ================= DELETE TRAINING =================
  async deleteTraining(id: number): Promise<void> {
    try {
      const participantCheck = await dbPool.query<{ id: number }>(
        'SELECT id FROM participants WHERE training_id = $1 LIMIT 1',
        [id],
      );

      if (participantCheck.rows.length) {
        throw new BadRequestException(
          'Cannot delete training: it has registered participants',
        );
      }

      const result = await dbPool.query<{ id: number }>(
        'DELETE FROM trainings WHERE id = $1 RETURNING id',
        [id],
      );

      if (!result.rows.length)
        throw new NotFoundException('Training not found');
    } catch (error) {
      console.error('Delete training error:', error);
      throw error;
    }
  }
}
