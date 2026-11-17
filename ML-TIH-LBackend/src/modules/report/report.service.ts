import { Injectable } from '@nestjs/common';
import { dbPool } from '../../database/db.pool';

interface CountRow {
  count: string;
}

type QueryValue = string | number;

@Injectable()
export class ReportService {
  async getDistricts() {
    const result = await dbPool.query<{
      district_cd: number;
      district_name: string;
    }>(
      `SELECT DISTINCT district_cd, district_name 
       FROM mst_cluster 
       ORDER BY district_name`,
    );
    return result.rows;
  }

  async getBlocks(district_cd: number) {
    const result = await dbPool.query<{ block_cd: number; block_name: string }>(
      `SELECT DISTINCT block_cd, block_name 
       FROM mst_cluster 
       WHERE district_cd = $1 
       ORDER BY block_name`,
      [district_cd],
    );
    return result.rows;
  }

  async getDashboardData(
    district_cd?: number,
    block_cd?: number,
    from_date?: string,
    to_date?: string,
  ) {
    let whereClause = '';
    const params: QueryValue[] = [];

    if (district_cd) {
      params.push(district_cd);
      whereClause += ` AND l.district_cd = $${params.length}`;
    }
    if (block_cd) {
      params.push(block_cd);
      whereClause += ` AND l.block_cd = $${params.length}`;
    }
    if (from_date) {
      params.push(from_date);
      whereClause += ` AND t.start_date >= $${params.length}::date`;
    }
    if (to_date) {
      params.push(to_date);
      whereClause += ` AND t.start_date < ($${params.length}::date + INTERVAL '1 day')`;
    }

    // Total Trainings
    const totalTrainingsQuery = await dbPool.query<CountRow>(
      `SELECT COUNT(*) as count 
       FROM trainings t 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}`,
      params,
    );

    // Total Participants
    const totalParticipantsQuery = await dbPool.query<CountRow>(
      `SELECT COALESCE(SUM(t.actual_participants), 0) as count 
       FROM trainings t 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}`,
      params,
    );

    // Total Trainers (distinct)
    const totalTrainersQuery = await dbPool.query<CountRow>(
      `SELECT COUNT(DISTINCT t.trainer_id) as count 
       FROM trainings t 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}`,
      params,
    );

    // Attendance Stats
    const attendanceStats = await dbPool.query<{
      attendance_status: string;
      count: string;
    }>(
      `SELECT attendance_status, COUNT(*) as count 
       FROM participants p 
       JOIN trainings t ON p.training_id = t.id 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}
       GROUP BY attendance_status`,
      params,
    );

    // Trainings per Subject
    const trainingsPerSubject = await dbPool.query<{
      name: string;
      count: string;
    }>(
      `SELECT s.name, COUNT(t.id) as count 
       FROM trainings t 
       JOIN subjects s ON t.subject_id = s.id 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}
       GROUP BY s.name 
       ORDER BY count DESC`,
      params,
    );

    // Trainer Performance
    const trainerPerformance = await dbPool.query<{
      name: string;
      trainings_count: string;
      avg_participants: string;
    }>(
      `SELECT tr.name, COUNT(t.id) as trainings_count, 
              COALESCE(AVG(t.actual_participants), 0)::numeric(10,2) as avg_participants
       FROM trainings t 
       JOIN trainers tr ON t.trainer_id = tr.id 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}
       GROUP BY tr.id, tr.name 
       ORDER BY trainings_count DESC 
       LIMIT 10`,
      params,
    );

    // Monthly Trends
    const monthlyTrends = await dbPool.query<{
      month: string;
      trainings: string;
    }>(
      `SELECT TO_CHAR(t.start_date, 'YYYY-MM') as month, COUNT(*) as trainings 
       FROM trainings t 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}
       GROUP BY month 
       ORDER BY month`,
      params,
    );

    // Participant Distribution (caste, education, category)
    const participantDistribution = await dbPool.query<{
      caste: string | null;
      education: string | null;
      category: string | null;
      count: string;
    }>(
      `SELECT caste, education, category, COUNT(*) as count 
       FROM participants p 
       JOIN trainings t ON p.training_id = t.id 
       JOIN locations l ON t.location_id = l.id 
       WHERE 1=1 ${whereClause}
       GROUP BY caste, education, category`,
      params,
    );

    // Map Data - Locations with lat/long and training count
    const mapData = await dbPool.query<{
      village: string;
      block: string;
      district: string;
      latitude: number;
      longitude: number;
      trainings_count: string;
      participants_count: string;
    }>(
      `SELECT 
         l.village, 
         l.block, 
         l.district, 
         l.latitude, 
         l.longitude, 
         COUNT(t.id) as trainings_count,
         COALESCE(SUM(t.actual_participants), 0) as participants_count
       FROM trainings t 
       RIGHT JOIN locations l ON t.location_id = l.id 
       WHERE l.latitude IS NOT NULL 
         AND l.longitude IS NOT NULL 
         ${whereClause}
       GROUP BY l.id, l.village, l.block, l.district, l.latitude, l.longitude
       HAVING COUNT(t.id) > 0 OR l.latitude IS NOT NULL`,
      params,
    );

    return {
      totalTrainings: parseInt(totalTrainingsQuery.rows[0].count || '0'),
      totalParticipants: parseInt(totalParticipantsQuery.rows[0].count || '0'),
      totalTrainers: parseInt(totalTrainersQuery.rows[0].count || '0'),
      attendanceStats: attendanceStats.rows,
      trainingsPerSubject: trainingsPerSubject.rows,
      trainerPerformance: trainerPerformance.rows,
      monthlyTrends: monthlyTrends.rows,
      participantDistribution: participantDistribution.rows,
      mapData: mapData.rows, // Ye map ke liye perfect hai
    };
  }
}
