import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TrainingService } from './training.service';
import {
  CreateTrainingDto,
  UpdateTrainingDto,
  TrainingQueryDto,
} from './dto/training.dto';
import { AuthGuard } from '../../utils/auth.guard';

@ApiTags('Training')
@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  @UseGuards(AuthGuard) // Auth kept for Create
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new training',
    description: 'Create a new training session. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateTrainingDto,
    description: 'New training details',
    examples: {
      example1: {
        summary: 'Sample training creation',
        value: {
          trainer_id: 1,
          subject_id: 1,
          location_id: 1,
          start_date: '2025-06-27T09:00:00Z',
          end_date: '2025-06-27T17:00:00Z',
          max_participants: 50,
          status: 'scheduled',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Training created successfully',
    schema: {
      example: {
        id: 1,
        trainer_id: 1,
        subject_id: 1,
        location_id: 1,
        start_date: '2025-06-27T09:00:00.000Z',
        end_date: '2025-06-27T17:00:00.000Z',
        max_participants: 50,
        actual_participants: 0,
        status: 'scheduled',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTraining(@Body() createDto: CreateTrainingDto) {
    return await this.trainingService.createTraining(createDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all trainings',
    description:
      'Get list of all trainings with optional filters. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'trainer_id',
    required: false,
    description: 'Filter by trainer ID',
    type: Number,
  })
  @ApiQuery({
    name: 'subject_id',
    required: false,
    description: 'Filter by subject ID',
    type: Number,
  })
  @ApiQuery({
    name: 'location_id',
    required: false,
    description: 'Filter by location ID',
    type: Number,
  })
  @ApiQuery({
    name: 'district_cd',
    required: false,
    description: 'Filter by district code',
    type: Number,
  })
  @ApiQuery({
    name: 'block_cd',
    required: false,
    description: 'Filter by block code',
    type: Number,
  })
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village name',
    type: String,
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filter by subject name',
    type: String,
  })
  @ApiQuery({
    name: 'training_type',
    required: false,
    description: 'Filter by training phase',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    type: String,
  })
  @ApiQuery({
    name: 'start_date_from',
    required: false,
    description: 'Filter from start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'start_date_to',
    required: false,
    description: 'Filter to start date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of trainings retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          trainer_id: 1,
          subject_id: 1,
          location_id: 1,
          start_date: '2025-06-27T09:00:00.000Z',
          end_date: '2025-06-27T17:00:00.000Z',
          max_participants: 50,
          actual_participants: 0,
          status: 'scheduled',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  // REMOVED: Auth responses (401, 403)
  async getAllTrainings(@Query() queryDto: TrainingQueryDto) {
    return await this.trainingService.getAllTrainings(queryDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard) // Auth kept for GetById
  @ApiOperation({
    summary: 'Get training by ID',
    description:
      'Get specific training details by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Training ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Training details retrieved successfully',
    schema: {
      example: {
        id: 1,
        trainer_id: 1,
        subject_id: 1,
        location_id: 1,
        start_date: '2025-06-27T09:00:00.000Z',
        end_date: '2025-06-27T17:00:00.000Z',
        max_participants: 50,
        actual_participants: 0,
        status: 'scheduled',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTrainingById(@Param('id') id: number) {
    return await this.trainingService.getTrainingById(id);
  }

  @Get(':id/details')
  @UseGuards(AuthGuard) // Auth kept for Details
  @ApiOperation({
    summary: 'Get training with details',
    description:
      'Get training details with trainer, subject, and location information. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Training ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Training with details retrieved successfully',
    schema: {
      example: {
        id: 1,
        trainer_id: 1,
        subject_id: 1,
        location_id: 1,
        start_date: '2025-06-27T09:00:00.000Z',
        end_date: '2025-06-27T17:00:00.000Z',
        max_participants: 50,
        actual_participants: 0,
        status: 'scheduled',
        created_at: '2025-01-01T00:00:00.000Z',
        trainer_name: 'John Doe',
        subject_name: 'Digital Literacy',
        location_details: {
          village: 'Chingali',
          block: 'Khairagarh',
          district: 'Khairagarh-Chhuikhadan-Gandai',
          state: 'Chhattisgarh',
          latitude: 21.5678,
          longitude: 81.2345,
        },
        total_participants: 0,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTrainingWithDetails(@Param('id') id: number) {
    return await this.trainingService.getTrainingWithDetails(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard) // Auth kept for Update
  @ApiOperation({
    summary: 'Update training',
    description: 'Update training details. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Training ID', type: Number })
  @ApiBody({
    type: UpdateTrainingDto,
    description: 'Fields to update',
    examples: {
      example1: {
        summary: 'Sample update data',
        value: {
          status: 'ongoing',
          max_participants: 60,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Training updated successfully',
    schema: {
      example: {
        id: 1,
        trainer_id: 1,
        subject_id: 1,
        location_id: 1,
        start_date: '2025-06-27T09:00:00.000Z',
        end_date: '2025-06-27T17:00:00.000Z',
        max_participants: 60,
        actual_participants: 0,
        status: 'ongoing',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateTraining(
    @Param('id') id: number,
    @Body() updateDto: UpdateTrainingDto,
  ) {
    return await this.trainingService.updateTraining(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard) // Auth kept for Delete
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete training',
    description: 'Delete training by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Training ID', type: Number })
  @ApiResponse({ status: 204, description: 'Training deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete: training has registered participants',
  })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteTraining(@Param('id') id: number) {
    await this.trainingService.deleteTraining(id);
  }
}
