import { Injectable } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';
import {
  DashboardSummary,
  TrainingStats,
  ParticipantStats,
} from './interfaces/dashboard.interface';
import { DashboardQueryDto } from './dto/dashboard.dto';

interface CountRow {
  count: string;
}

interface StatusCountRow extends CountRow {
  status: string;
}

interface SubjectCountRow extends CountRow {
  subject_name: string;
}

interface DistrictCountRow extends CountRow {
  district: string;
}

interface CategoryCountRow extends CountRow {
  category: string;
}

interface CasteCountRow extends CountRow {
  caste: string;
}

interface EducationCountRow extends CountRow {
  education: string;
}

interface AttendanceCountRow extends CountRow {
  attendance_status: string | null;
}

@Injectable()
export class DashboardService {
  // Build dynamic WHERE conditions
  private buildConditions(
    queryDto: DashboardQueryDto = {},
    includeParticipantFilters = false,
  ): {
    conditions: string;
    params: any[];
  } {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramCount = 0;

    // =====================================
    // LOCATION FILTERS (CODE BASED - PRIORITY)
    // =====================================
    if (queryDto.district_cd) {
      paramCount++;
      conditions.push(`l.district_cd = $${paramCount}`);
      params.push(queryDto.district_cd);
    }

    if (queryDto.block_cd) {
      paramCount++;
      conditions.push(`l.block_cd = $${paramCount}`);
      params.push(queryDto.block_cd);
    }

    // ===================================
    // LOCATION FILTERS (NAME BASED - FALLBACK)
    // Applied ONLY if code is not provided
    // ===================================
    if (!queryDto.district_cd && queryDto.district) {
      paramCount++;
      conditions.push(`l.district = $${paramCount}`);
      params.push(queryDto.district);
    }

    if (!queryDto.block_cd && queryDto.block) {
      paramCount++;
      conditions.push(`l.block = $${paramCount}`);
      params.push(queryDto.block);
    }

    if (queryDto.village) {
      paramCount++;
      conditions.push(`l.village = $${paramCount}`);
      params.push(queryDto.village);
    }

    if (queryDto.state) {
      paramCount++;
      conditions.push(`l.state = $${paramCount}`);
      params.push(queryDto.state);
    }

    // =====================================
    // DATE FILTERS
    // =====================================
    if (queryDto.start_date) {
      paramCount++;
      conditions.push(`t.start_date >= $${paramCount}`);
      params.push(new Date(queryDto.start_date));
    }

    if (queryDto.end_date) {
      paramCount++;
      if (/^\d{4}-\d{2}-\d{2}$/.test(queryDto.end_date)) {
        conditions.push(
          `t.start_date < ($${paramCount}::date + INTERVAL '1 day')`,
        );
      } else {
        conditions.push(`t.start_date <= $${paramCount}`);
      }
      params.push(queryDto.end_date);
    }

    // =====================================
    // TRAINING FILTERS
    // =====================================
    if (queryDto.subject) {
      paramCount++;
      conditions.push(`s.name = $${paramCount}`);
      params.push(queryDto.subject);
    }

    if (queryDto.status) {
      paramCount++;
      conditions.push(`t.status = $${paramCount}`);
      params.push(queryDto.status);
    }

    if (queryDto.trainer_id) {
      paramCount++;
      conditions.push(`t.trainer_id = $${paramCount}`);
      params.push(queryDto.trainer_id);
    }

    if (queryDto.training_type) {
      paramCount++;
      conditions.push(`t.training_type = $${paramCount}`);
      params.push(queryDto.training_type);
    }

    if (includeParticipantFilters) {
      if (queryDto.category) {
        paramCount++;
        conditions.push(`p.category = $${paramCount}`);
        params.push(queryDto.category);
      }
      if (queryDto.caste) {
        paramCount++;
        conditions.push(`p.caste = $${paramCount}`);
        params.push(queryDto.caste);
      }
      if (queryDto.education) {
        paramCount++;
        conditions.push(`p.education = $${paramCount}`);
        params.push(queryDto.education);
      }
      if (queryDto.attendance_status) {
        paramCount++;
        conditions.push(`p.attendance_status = $${paramCount}`);
        params.push(queryDto.attendance_status);
      }
      if (queryDto.age_from !== undefined) {
        paramCount++;
        conditions.push(`p.age >= $${paramCount}`);
        params.push(queryDto.age_from);
      }
      if (queryDto.age_to !== undefined) {
        paramCount++;
        conditions.push(`p.age <= $${paramCount}`);
        params.push(queryDto.age_to);
      }
    }

    return {
      conditions: conditions.join(' AND '),
      params,
    };
  }

  // Get dashboard summary
  async getDashboardSummary(
    queryDto?: DashboardQueryDto,
  ): Promise<DashboardSummary> {
    try {
      const { conditions, params } = this.buildConditions(queryDto);
      const participantFilters = this.buildConditions(queryDto, true);

      // Get all counts in parallel
      //  SELECT COUNT(*) as count FROM participants p
      // LEFT JOIN trainings t ON p.training_id = t.id
      // LEFT JOIN locations l ON t.location_id = l.id
      // LEFT JOIN subjects s ON t.subject_id = s.id
      // WHERE ${conditions}

      const [
        trainerCount,
        subjectCount,
        locationCount,
        trainingCount,
        participantCount,
        activeTrainingCount,
        completedTrainingCount,
        scheduledTrainingCount,
      ] = await Promise.all([
        dbPool.query<CountRow>(
          `
          SELECT COUNT(DISTINCT tr.id) as count FROM trainers tr
          LEFT JOIN trainings t ON tr.id = t.trainer_id
          LEFT JOIN locations l ON t.location_id = l.id
          WHERE ${conditions}
        `,
          params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(DISTINCT s.id) as count FROM subjects s
          LEFT JOIN trainings t ON s.id = t.subject_id
          LEFT JOIN locations l ON t.location_id = l.id
          WHERE ${conditions}
        `,
          params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(DISTINCT l.id) as count FROM locations l
          LEFT JOIN trainings t ON l.id = t.location_id
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE ${conditions}
        `,
          params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(*) as count FROM trainings t
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN subjects s ON t.subject_id = s.id
          LEFT JOIN trainers tr ON t.trainer_id = tr.id
          WHERE ${conditions}
        `,
          params,
        ),
        // ON p.trainer_id = t.trainer_id
        dbPool.query<CountRow>(
          `
        

          SELECT COUNT(DISTINCT p.id) as count
FROM participants p
LEFT JOIN trainings t

ON p.training_id = t.id
AND p.training = t.subject
AND p.village = t.village
LEFT JOIN locations l ON t.location_id = l.id
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE ${participantFilters.conditions}
        `,
          participantFilters.params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(*) as count FROM trainings t
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE t.status = 'ongoing' AND ${conditions}
        `,
          params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(*) as count FROM trainings t
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE t.status = 'completed' AND ${conditions}
        `,
          params,
        ),
        dbPool.query<CountRow>(
          `
          SELECT COUNT(*) as count FROM trainings t
          LEFT JOIN locations l ON t.location_id = l.id
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE t.status = 'scheduled' AND ${conditions}
        `,
          params,
        ),
      ]);

      return {
        total_trainers: parseInt(trainerCount.rows[0].count),
        total_subjects: parseInt(subjectCount.rows[0].count),
        total_locations: parseInt(locationCount.rows[0].count),
        total_trainings: parseInt(trainingCount.rows[0].count),
        total_participants: parseInt(participantCount.rows[0].count),
        active_trainings: parseInt(activeTrainingCount.rows[0].count),
        completed_trainings: parseInt(completedTrainingCount.rows[0].count),
        scheduled_trainings: parseInt(scheduledTrainingCount.rows[0].count),
      };
    } catch (error) {
      // catch (error) {
      //   // catch (error) {
      //   //   console.error('Get dashboard summary error:', error);
      //   //   throw new Error('Failed to fetch dashboard summary');
      //   // }
      //   console.error(error);
      //   throw new Error('Failed to fetch dashboard summary');
      // }
      console.error('Dashboard Error:', error);
      throw error;
    }
  }

  // Get training statistics
  async getTrainingStats(queryDto?: DashboardQueryDto): Promise<TrainingStats> {
    try {
      const { conditions, params } = this.buildConditions(queryDto);

      // Get training stats by status
      const statusResult = await dbPool.query<StatusCountRow>(
        `
        SELECT status, COUNT(*) as count
        FROM trainings t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE ${conditions}
        GROUP BY status
      `,
        params,
      );

      // Get training stats by subject
      const subjectResult = await dbPool.query<SubjectCountRow>(
        `
        SELECT s.name as subject_name, COUNT(*) as count
        FROM trainings t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE ${conditions}
        GROUP BY s.name
        ORDER BY count DESC
      `,
        params,
      );

      // Get training stats by location (district)
      const locationResult = await dbPool.query<DistrictCountRow>(
        `
        SELECT l.district, COUNT(*) as count
        FROM trainings t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE l.district IS NOT NULL AND ${conditions}
        GROUP BY l.district
        ORDER BY count DESC
      `,
        params,
      );

      // Initialize status counts
      const by_status = {
        scheduled: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
      };

      // Fill status counts
      statusResult.rows.forEach((row) => {
        if (Object.hasOwn(by_status, row.status)) {
          by_status[row.status as keyof typeof by_status] = parseInt(row.count);
        }
      });

      return {
        by_status,
        by_subject: subjectResult.rows.map((row) => ({
          subject_name: row.subject_name,
          count: parseInt(row.count),
        })),
        by_location: locationResult.rows.map((row) => ({
          district: row.district,
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      console.error('Get training stats error:', error);
      throw new Error('Failed to fetch training statistics');
    }
  }

  // Get participant statistics
  async getParticipantStats(
    queryDto?: DashboardQueryDto,
  ): Promise<ParticipantStats> {
    try {
      const { conditions, params } = this.buildConditions(queryDto, true);

      const categoryResult = await dbPool.query<CategoryCountRow>(
        `SELECT p.category, COUNT(DISTINCT p.id) AS count
         FROM participants p
         LEFT JOIN trainings t ON p.training_id = t.id
         LEFT JOIN locations l ON t.location_id = l.id
         LEFT JOIN subjects s ON t.subject_id = s.id
         WHERE p.category IS NOT NULL AND ${conditions}
         GROUP BY p.category
         ORDER BY count DESC`,
        params,
      );

      // Get participant stats by caste
      //LEFT JOIN trainings t ON p.training_id = t.id
      // ON p.trainer_id = t.trainer_id
      const casteResult = await dbPool.query<CasteCountRow>(
        `
        SELECT p.caste, COUNT(*) as count
        FROM participants p
        
        LEFT JOIN trainings t ON p.training_id = t.id
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE p.caste IS NOT NULL AND ${conditions}
        GROUP BY p.caste
        ORDER BY count DESC
      `,
        params,
      );

      // Get participant stats by education
      // LEFT JOIN trainings t ON p.training_id = t.id
      //               LEFT JOIN trainings t
      // ON p.trainer_id = t.trainer_id
      const educationResult = await dbPool.query<EducationCountRow>(
        `
        SELECT p.education, COUNT(*) as count
        FROM participants p
       

LEFT JOIN trainings t
ON p.training_id = t.id

AND p.training = t.subject
AND p.village = t.village
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE p.education IS NOT NULL AND ${conditions}
        GROUP BY p.education
        ORDER BY count DESC
      `,
        params,
      );

      // Get attendance statistics
      //LEFT JOIN trainings t ON p.training_id = t.id
      //ON p.trainer_id = t.trainer_id
      const attendanceResult = await dbPool.query<AttendanceCountRow>(
        `
        SELECT p.attendance_status, COUNT(*) as count
        FROM participants p
        
        LEFT JOIN trainings t
        ON p.training_id = t.id

AND p.training = t.subject
AND p.village = t.village
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE ${conditions}
        GROUP BY p.attendance_status
      `,
        params,
      );

      // Initialize attendance stats
      const attendance_stats = {
        present: 0,
        absent: 0,
        late: 0,
      };

      // Fill attendance stats
      attendanceResult.rows.forEach((row) => {
        const status = String(row.attendance_status || '').toLowerCase();
        if (Object.hasOwn(attendance_stats, status)) {
          attendance_stats[status] = parseInt(row.count, 10);
        }
      });

      return {
        by_category: categoryResult.rows.map((row) => ({
          category: row.category,
          count: parseInt(row.count, 10),
        })),
        by_caste: casteResult.rows.map((row) => ({
          caste: row.caste,
          count: parseInt(row.count),
        })),
        by_education: educationResult.rows.map((row) => ({
          education: row.education,
          count: parseInt(row.count),
        })),
        attendance_stats,
      };
    } catch (error) {
      console.error('Get participant stats error:', error);
      throw new Error('Failed to fetch participant statistics');
    }
  }

  // Get complete dashboard data
  async getCompleteDashboard(queryDto?: DashboardQueryDto) {
    const [summary, trainingStats, participantStats] = await Promise.all([
      this.getDashboardSummary(queryDto),
      this.getTrainingStats(queryDto),
      this.getParticipantStats(queryDto),
    ]);

    return {
      summary,
      training_stats: trainingStats,
      participant_stats: participantStats,
    };
  }
}
