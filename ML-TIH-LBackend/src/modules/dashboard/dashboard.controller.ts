import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard.dto';
import { AuthGuard } from '../../utils/auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get dashboard summary',
    description: 'Get complete dashboard summary with all counts.',
  })
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
    type: String,
  })
  @ApiQuery({
    name: 'block',
    required: false,
    description: 'Filter by block',
    type: String,
  })
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state',
    type: String,
  })
  // Date filters next
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Filter from start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'Filter to end date (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    schema: {
      example: {
        total_trainers: 5,
        total_subjects: 3,
        total_locations: 10,
        total_trainings: 15,
        total_participants: 200,
        active_trainings: 3,
        completed_trainings: 8,
        scheduled_trainings: 4,
      },
    },
  })
  async getDashboardSummary(@Query() queryDto: DashboardQueryDto) {
    return this.dashboardService.getDashboardSummary(queryDto);
  }

  @Get('training-stats')
  @ApiOperation({
    summary: 'Get training statistics',
    description: 'Get training statistics by status, subject, and location.',
  })
  // Location filters first
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
    type: String,
  })
  @ApiQuery({
    name: 'block',
    required: false,
    description: 'Filter by block',
    type: String,
  })
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state',
    type: String,
  })
  // Date filters next
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Filter from start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'Filter to end date (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Training statistics retrieved successfully',
    schema: {
      example: {
        by_status: {
          scheduled: 4,
          ongoing: 3,
          completed: 8,
          cancelled: 0,
        },
        by_subject: [
          { subject_name: 'Digital Literacy', count: 10 },
          { subject_name: 'Agriculture', count: 5 },
        ],
        by_location: [
          { district: 'Khairagarh', count: 8 },
          { district: 'Raipur', count: 7 },
        ],
      },
    },
  })
  async getTrainingStats(@Query() queryDto: DashboardQueryDto) {
    return this.dashboardService.getTrainingStats(queryDto);
  }

  @Get('participant-stats')
  @ApiOperation({
    summary: 'Get participant statistics',
    description:
      'Get participant statistics by category, caste, education, and attendance.',
  })
  // Location filters first
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
    type: String,
  })
  @ApiQuery({
    name: 'block',
    required: false,
    description: 'Filter by block',
    type: String,
  })
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state',
    type: String,
  })
  // Date filters
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Filter from start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'Filter to end date (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant statistics retrieved successfully',
    schema: {
      example: {
        by_category: [
          { category: 'Women', count: 120 },
          { category: 'Youth', count: 80 },
        ],
        by_caste: [
          { caste: 'OBC', count: 100 },
          { caste: 'SC', count: 60 },
          { caste: 'General', count: 40 },
        ],
        by_education: [
          { education: '10th', count: 80 },
          { education: '8th', count: 70 },
          { education: '12th', count: 50 },
        ],
        attendance_stats: {
          present: 180,
          absent: 15,
          late: 5,
        },
      },
    },
  })
  async getParticipantStats(@Query() queryDto: DashboardQueryDto) {
    return this.dashboardService.getParticipantStats(queryDto);
  }

  @Get('complete')
  @ApiOperation({
    summary: 'Get complete dashboard data',
    description:
      'Get complete dashboard data with summary, training stats, and participant stats.',
  })
  // Location filters first
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
    type: String,
  })
  @ApiQuery({
    name: 'block',
    required: false,
    description: 'Filter by block',
    type: String,
  })
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state',
    type: String,
  })
  // Date filters next
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Filter from start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'Filter to end date (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete dashboard data retrieved successfully',
    schema: {
      example: {
        summary: {
          total_trainers: 5,
          total_subjects: 3,
          total_locations: 10,
          total_trainings: 15,
          total_participants: 200,
          active_trainings: 3,
          completed_trainings: 8,
          scheduled_trainings: 4,
        },
      },
    },
  })
  async getCompleteDashboard(@Query() queryDto: DashboardQueryDto) {
    return this.dashboardService.getCompleteDashboard(queryDto);
  }
}
