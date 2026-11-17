import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryDto,
} from './dto/subject.dto';
import { dbPool } from '../../database/db.pool';
import { Subject, SubjectWithStats } from './interfaces/subject.interface';

@Injectable()
export class SubjectService {
  // Create new subject
  async createSubject(createDto: CreateSubjectDto): Promise<Subject> {
    const { name, description } = createDto;

    try {
      // Check if subject already exists
      const existingSubject = await dbPool.query<{ id: number }>(
        'SELECT id FROM subjects WHERE name = $1',
        [name],
      );
      if (existingSubject.rows.length > 0) {
        throw new BadRequestException('Subject with this name already exists');
      }

      // Insert new subject
      const result = await dbPool.query<Subject>(
        `INSERT INTO subjects (name, description) 
         VALUES ($1, $2) 
         RETURNING *`,
        [name, description],
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Create subject error:', error);
      throw new BadRequestException('Failed to create subject');
    }
  }

  // Get all subjects with optional search
  async getAllSubjects(queryDto: SubjectQueryDto = {}): Promise<Subject[]> {
    const { search, page = 1, limit = 10 } = queryDto;

    try {
      let query = `SELECT * FROM subjects WHERE 1=1`;
      const params: any[] = [];
      let paramCount = 0;

      // Add search filter
      if (search) {
        paramCount++;
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit.toString()),
        (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
      );

      const result = await dbPool.query<Subject>(query, params);
      return result.rows;
    } catch (error) {
      console.error('Get all subjects error:', error);
      throw new BadRequestException('Failed to fetch subjects');
    }
  }

  // Get subject by ID
  async getSubjectById(id: number): Promise<Subject> {
    try {
      const result = await dbPool.query<Subject>(
        'SELECT * FROM subjects WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Subject not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get subject by ID error:', error);
      throw new BadRequestException('Failed to fetch subject');
    }
  }

  // Get subject with statistics
  async getSubjectWithStats(id: number): Promise<SubjectWithStats> {
    try {
      const subjectResult = await dbPool.query<Subject>(
        'SELECT * FROM subjects WHERE id = $1',
        [id],
      );

      if (subjectResult.rows.length === 0) {
        throw new NotFoundException('Subject not found');
      }

      // Get statistics (total trainings using this subject)
      const statsResult = await dbPool.query<{ total_trainings: string }>(
        `
        SELECT COUNT(id) as total_trainings
        FROM trainings 
        WHERE subject_id = $1
      `,
        [id],
      );

      const subject = subjectResult.rows[0];
      const stats = statsResult.rows[0];

      return {
        ...subject,
        total_trainings: parseInt(stats.total_trainings),
      };
    } catch (error) {
      console.error('Get subject with stats error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch subject with statistics');
    }
  }

  // Update subject
  async updateSubject(
    id: number,
    updateDto: UpdateSubjectDto,
  ): Promise<Subject> {
    const { name, description } = updateDto;

    try {
      // Build dynamic query
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (name !== undefined) {
        // Check if new name already exists (excluding current subject)
        const existingSubject = await dbPool.query<{ id: number }>(
          'SELECT id FROM subjects WHERE name = $1 AND id != $2',
          [name, id],
        );
        if (existingSubject.rows.length > 0) {
          throw new BadRequestException(
            'Subject with this name already exists',
          );
        }

        paramCount++;
        updates.push(`name = $${paramCount}`);
        params.push(name);
      }
      if (description !== undefined) {
        paramCount++;
        updates.push(`description = $${paramCount}`);
        params.push(description);
      }

      if (updates.length === 0) {
        // throw new BadRequestException('No fields to update');
        return await this.getSubjectById(id);
      }

      // Add ID parameter
      paramCount++;
      params.push(id);

      const query = `UPDATE subjects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await dbPool.query<Subject>(query, params);

      if (result.rows.length === 0) {
        throw new NotFoundException('Subject not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Update subject error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update subject');
    }
  }

  // Delete subject
  async deleteSubject(id: number): Promise<void> {
    try {
      // Check if subject is being used in any training
      const trainingCheck = await dbPool.query<{ id: number }>(
        'SELECT id FROM trainings WHERE subject_id = $1 LIMIT 1',
        [id],
      );

      if (trainingCheck.rows.length > 0) {
        throw new BadRequestException(
          'Cannot delete subject: it is being used in trainings',
        );
      }

      const result = await dbPool.query<{ id: number }>(
        'DELETE FROM subjects WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Subject not found');
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Delete subject error:', error);
      throw new BadRequestException('Failed to delete subject');
    }
  }
}
