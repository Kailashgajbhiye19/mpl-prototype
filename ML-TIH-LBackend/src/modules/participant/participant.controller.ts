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
import { ParticipantService } from './participant.service';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
  ParticipantQueryDto,
} from './dto/participant.dto';
import { AuthGuard } from '../../utils/auth.guard';

@ApiTags('Participant')
@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new participant',
    description:
      'Register a new participant for a training. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateParticipantDto,
    description: 'New participant details',
    examples: {
      example1: {
        summary: 'Sample participant registration',
        value: {
          training_id: 1,
          name: 'Dasmal Sahu',
          phone: '9876543210',
          age: 25,
          caste: 'OBC',
          education: '10th',
          category: 'Women',
          profile_image_url: 'https://example.com/image.jpg',
          attendance_status: 'present',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Participant created successfully',
    schema: {
      example: {
        id: 1,
        training_id: 1,
        name: 'Dasmal Sahu',
        phone: '9876543210',
        age: 25,
        caste: 'OBC',
        education: '10th',
        category: 'Women',
        profile_image_url: 'https://example.com/image.jpg',
        attendance_status: 'present',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createParticipant(@Body() createDto: CreateParticipantDto) {
    return await this.participantService.createParticipant(createDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all participants',
    description:
      'Get list of all participants with optional filters. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'training_id',
    required: false,
    description: 'Filter by training ID',
    type: Number,
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by participant name',
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category (Women, Youth, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'caste',
    required: false,
    description: 'Filter by caste',
    type: String,
  })
  @ApiQuery({
    name: 'education',
    required: false,
    description: 'Filter by education level',
    type: String,
  })
  @ApiQuery({
    name: 'attendance_status',
    required: false,
    description: 'Filter by attendance status',
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
    description: 'List of participants retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          training_id: 1,
          name: 'Dasmal Sahu',
          phone: '9876543210',
          age: 25,
          caste: 'OBC',
          education: '10th',
          category: 'Women',
          profile_image_url: 'https://example.com/image.jpg',
          attendance_status: 'present',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllParticipants(@Query() queryDto: ParticipantQueryDto) {
    return await this.participantService.getAllParticipants(queryDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get participant by ID',
    description:
      'Get specific participant details by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Participant ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Participant details retrieved successfully',
    schema: {
      example: {
        id: 1,
        training_id: 1,
        name: 'Dasmal Sahu',
        phone: '9876543210',
        age: 25,
        caste: 'OBC',
        education: '10th',
        category: 'Women',
        profile_image_url: 'https://example.com/image.jpg',
        attendance_status: 'present',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getParticipantById(@Param('id') id: number) {
    return await this.participantService.getParticipantById(id);
  }

  @Get(':id/details')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get participant with training details',
    description:
      'Get participant details with training information. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Participant ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Participant with training details retrieved successfully',
    schema: {
      example: {
        id: 1,
        training_id: 1,
        name: 'Dasmal Sahu',
        phone: '9876543210',
        age: 25,
        caste: 'OBC',
        education: '10th',
        category: 'Women',
        profile_image_url: 'https://example.com/image.jpg',
        attendance_status: 'present',
        created_at: '2025-01-01T00:00:00.000Z',
        training_details: {
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
          start_date: '2025-06-27T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getParticipantWithTrainingDetails(@Param('id') id: number) {
    return await this.participantService.getParticipantWithTrainingDetails(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update participant',
    description: 'Update participant details. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Participant ID', type: Number })
  @ApiBody({
    type: UpdateParticipantDto,
    description: 'Fields to update',
    examples: {
      example1: {
        summary: 'Sample update data',
        value: {
          name: 'Dasmal Sahu Updated',
          age: 26,
          attendance_status: 'present',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Participant updated successfully',
    schema: {
      example: {
        id: 1,
        training_id: 1,
        name: 'Dasmal Sahu Updated',
        phone: '9876543210',
        age: 26,
        caste: 'OBC',
        education: '10th',
        category: 'Women',
        profile_image_url: 'https://example.com/image.jpg',
        attendance_status: 'present',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateParticipant(
    @Param('id') id: number,
    @Body() updateDto: UpdateParticipantDto,
  ) {
    return await this.participantService.updateParticipant(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete participant',
    description: 'Delete participant by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Participant ID', type: Number })
  @ApiResponse({ status: 204, description: 'Participant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteParticipant(@Param('id') id: number) {
    await this.participantService.deleteParticipant(id);
  }
}
