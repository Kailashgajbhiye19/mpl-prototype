import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
  ParticipantQueryDto,
  AttendanceStatus,
} from './dto/participant.dto';
import { dbPool } from '../../database/db.pool';
import {
  Participant,
  ParticipantWithTrainingDetails,
} from './interfaces/participant.interface';

interface TrainingParticipantContext {
  trainer_id: number | null;
  training: string | null;
  village: string | null;
}

type ParticipantRow = Participant;

interface ParticipantDetailsRow extends ParticipantRow {
  trainer_name: string | null;
  subject_name: string | null;
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  district_cd?: number | null;
  block_cd?: number | null;
  latitude: number | null;
  longitude: number | null;
  start_date: Date | null;
}

type QueryValue = string | number | Date | null;

@Injectable()
export class ParticipantService {
  // Create new participant
  async createParticipant(
    createDto: CreateParticipantDto,
  ): Promise<Participant> {
    const {
      training_id,
      name,
      phone,
      age,
      caste,
      education,
      category,
      profile_image_url,
      attendance_status = AttendanceStatus.PRESENT,
    } = createDto;

    try {
      // Validate training exists
      const trainingCheck = await dbPool.query<{ id: number }>(
        'SELECT id FROM trainings WHERE id = $1',
        [training_id],
      );
      if (trainingCheck.rows.length === 0) {
        throw new BadRequestException('Training not found');
      }

      // Check if phone already exists in this training
      if (phone) {
        const existingPhone = await dbPool.query<{ id: number }>(
          'SELECT id FROM participants WHERE training_id = $1 AND phone = $2',
          [training_id, phone],
        );
        if (existingPhone.rows.length > 0) {
          throw new BadRequestException(
            'Phone number already registered for this training',
          );
        }
      }

      const trainingResult = await dbPool.query<TrainingParticipantContext>(
        `
  SELECT
    t.trainer_id,
    s.name AS training,
    l.village
  FROM trainings t
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN locations l ON t.location_id = l.id
  WHERE t.id = $1
  `,
        [training_id],
      );

      if (!trainingResult.rows.length) {
        throw new BadRequestException('Training not found');
      }

      const trainingInfo = trainingResult.rows[0];

      // Insert new participant
      const result = await dbPool.query<ParticipantRow>(
        // `INSERT INTO participants (training_id, name, phone, age, caste, education, category, profile_image_url, attendance_status)
        //  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        //  RETURNING *`,
        ` INSERT INTO participants (
training_id,
trainer_id,
training,
village,
name,
phone,
age,
caste,
education,
category,
profile_image_url,
attendance_status
)
VALUES (
$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
)
RETURNING *`,
        // [
        //   training_id,
        //   name,
        //   phone,
        //   age,
        //   caste,
        //   education,
        //   category,
        //   profile_image_url,
        //   attendance_status,
        // ],
        [
          training_id,
          trainingInfo.trainer_id,
          trainingInfo.training,
          trainingInfo.village,
          name,
          phone,
          age,
          caste,
          education,
          category,
          profile_image_url,
          attendance_status,
        ],
      );

      // Update actual participants count in training
      await dbPool.query(
        'UPDATE trainings SET actual_participants = actual_participants + 1 WHERE id = $1',
        [training_id],
      );

      return result.rows[0];
    } catch (error) {
      console.error('Create participant error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create participant');
    }
  }

  // Get all participants with optional filters (with JOIN for training details)
  async getAllParticipants(
    queryDto: ParticipantQueryDto = {},
  ): Promise<ParticipantWithTrainingDetails[]> {
    const {
      training_id,
      name,
      category,
      caste,
      education,
      attendance_status,
      page = 1,
      limit = 10,
    } = queryDto;

    try {
      let query = `
        SELECT DISTINCT ON (p.id)
          p.*,
          tr.name as trainer_name,
          s.name as subject_name,
          l.village,
          l.block,
          l.district,
          l.state,
          l.district_cd,
          l.block_cd,
          l.latitude,
          l.longitude,
          t.start_date
        FROM participants p
        LEFT JOIN trainings t ON p.training_id = t.id
        LEFT JOIN trainers tr ON t.trainer_id = tr.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE 1=1
      `;

      const params: QueryValue[] = [];
      let paramCount = 0;

      if (training_id) {
        paramCount++;
        query += ` AND p.training_id = $${paramCount}`;
        params.push(training_id);
      }
      if (name) {
        paramCount++;
        query += ` AND p.name ILIKE $${paramCount}`;
        params.push(`%${name}%`);
      }
      if (category) {
        paramCount++;
        query += ` AND p.category ILIKE $${paramCount}`;
        params.push(`%${category}%`);
      }
      if (caste) {
        paramCount++;
        query += ` AND p.caste ILIKE $${paramCount}`;
        params.push(`%${caste}%`);
      }
      if (education) {
        paramCount++;
        query += ` AND p.education ILIKE $${paramCount}`;
        params.push(`%${education}%`);
      }
      if (attendance_status) {
        paramCount++;
        query += ` AND p.attendance_status = $${paramCount}`;
        params.push(attendance_status);
      }

      query += ` ORDER BY p.id, t.id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit.toString()),
        (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
      );

      const result = await dbPool.query<ParticipantDetailsRow>(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        training_id: row.training_id,
        training: row.training,
        name: row.name,
        phone: row.phone,
        age: row.age,
        caste: row.caste,
        education: row.education,
        category: row.category,
        profile_image_url: row.profile_image_url,
        attendance_status: row.attendance_status,
        created_at: row.created_at,
        training_details: {
          trainer_name: row.trainer_name,
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
          },
          start_date: row.start_date,
        },
      }));
    } catch (error) {
      console.error('Get all participants error:', error);
      throw new BadRequestException('Failed to fetch participants');
    }
  }

  // Get participant by ID
  async getParticipantById(id: number): Promise<Participant> {
    try {
      const result = await dbPool.query<ParticipantRow>(
        'SELECT * FROM participants WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Participant not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get participant by ID error:', error);
      throw new BadRequestException('Failed to fetch participant');
    }
  }

  // Get participant with training details (already includes JOINs)
  // LEFT JOIN trainings t ON p.training_id = t.id
  async getParticipantWithTrainingDetails(
    id: number,
  ): Promise<ParticipantWithTrainingDetails> {
    try {
      const result = await dbPool.query<ParticipantDetailsRow>(
        `
        SELECT 
          p.*,
          tr.name as trainer_name,
          s.name as subject_name,
          l.village,
          l.block,
          l.district,
          l.state,
          l.latitude,
          l.longitude,
          t.start_date
        FROM participants p
        LEFT JOIN trainings t
        ON p.training_id = t.id
        LEFT JOIN trainers tr ON t.trainer_id = tr.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE p.id = $1
      `,
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Participant not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        training_id: row.training_id,
        training: row.training,
        name: row.name,
        phone: row.phone,
        age: row.age,
        caste: row.caste,
        education: row.education,
        category: row.category,
        profile_image_url: row.profile_image_url,
        attendance_status: row.attendance_status,
        created_at: row.created_at,
        training_details: {
          trainer_name: row.trainer_name,
          subject_name: row.subject_name,
          location_details: {
            village: row.village,
            block: row.block,
            district: row.district,
            state: row.state,
            latitude: row.latitude,
            longitude: row.longitude,
          },
          start_date: row.start_date,
        },
      };
    } catch (error) {
      console.error('Get participant with training details error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch participant with training details',
      );
    }
  }

  // Update participant
  async updateParticipant(
    id: number,
    updateDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const {
      name,
      phone,
      age,
      caste,
      education,
      category,
      profile_image_url,
      attendance_status,
    } = updateDto;

    try {
      // Build dynamic query
      const updates: string[] = [];
      const params: QueryValue[] = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        params.push(name);
      }
      if (phone !== undefined) {
        // Check if phone already exists for this training (excluding current participant)
        const existingPhone = await dbPool.query<{ id: number }>(
          'SELECT id FROM participants WHERE training_id = (SELECT training_id FROM participants WHERE id = $2) AND phone = $1 AND id != $2',
          [phone, id],
        );
        if (existingPhone.rows.length > 0) {
          throw new BadRequestException(
            'Phone number already registered for this training',
          );
        }
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        params.push(phone);
      }
      if (age !== undefined) {
        paramCount++;
        updates.push(`age = $${paramCount}`);
        params.push(age);
      }
      if (caste !== undefined) {
        paramCount++;
        updates.push(`caste = $${paramCount}`);
        params.push(caste);
      }
      if (education !== undefined) {
        paramCount++;
        updates.push(`education = $${paramCount}`);
        params.push(education);
      }
      if (category !== undefined) {
        paramCount++;
        updates.push(`category = $${paramCount}`);
        params.push(category);
      }
      if (profile_image_url !== undefined) {
        paramCount++;
        updates.push(`profile_image_url = $${paramCount}`);
        params.push(profile_image_url);
      }
      if (attendance_status !== undefined) {
        paramCount++;
        updates.push(`attendance_status = $${paramCount}`);
        params.push(attendance_status);
      }

      if (updates.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      // Add ID parameter
      paramCount++;
      params.push(id);

      const query = `UPDATE participants SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await dbPool.query<ParticipantRow>(query, params);

      if (result.rows.length === 0) {
        throw new NotFoundException('Participant not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Update participant error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update participant');
    }
  }

  // Delete participant
  async deleteParticipant(id: number): Promise<void> {
    try {
      const participantResult = await dbPool.query<{ training_id: number }>(
        'SELECT training_id FROM participants WHERE id = $1',
        [id],
      );

      if (participantResult.rows.length === 0) {
        throw new NotFoundException('Participant not found');
      }

      const training_id = participantResult.rows[0].training_id;

      // Delete participant
      const result = await dbPool.query<{ id: number }>(
        'DELETE FROM participants WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Participant not found');
      }

      // Update actual participants count in training
      await dbPool.query(
        'UPDATE trainings SET actual_participants = actual_participants - 1 WHERE id = $1',
        [training_id],
      );
    } catch (error) {
      console.error('Delete participant error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete participant');
    }
  }
}
