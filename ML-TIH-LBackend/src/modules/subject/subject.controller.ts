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
import { SubjectService } from './subject.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectQueryDto,
} from './dto/subject.dto';
import { AuthGuard } from '../../utils/auth.guard';

@ApiTags('Subject')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new subject',
    description: 'Create a new subject. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateSubjectDto,
    description: 'New subject details',
    examples: {
      example1: {
        summary: 'Sample subject creation',
        value: {
          name: 'Digital Literacy',
          description: 'Basic computer and internet skills',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Digital Literacy',
        description: 'Basic computer and internet skills',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createSubject(@Body() createDto: CreateSubjectDto) {
    return await this.subjectService.createSubject(createDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all subjects',
    description:
      'Get list of all subjects with optional search. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by subject name',
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
    description: 'List of subjects retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'Digital Literacy',
          description: 'Basic computer and internet skills',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllSubjects(@Query() queryDto: SubjectQueryDto) {
    return await this.subjectService.getAllSubjects(queryDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get subject by ID',
    description:
      'Get specific subject details by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Subject ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Subject details retrieved successfully',
    schema: {
      example: {
        id: 1,
        name: 'Digital Literacy',
        description: 'Basic computer and internet skills',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSubjectById(@Param('id') id: number) {
    return await this.subjectService.getSubjectById(id);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get subject with statistics',
    description:
      'Get subject details with training statistics. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Subject ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Subject with statistics retrieved successfully',
    schema: {
      example: {
        id: 1,
        name: 'Digital Literacy',
        description: 'Basic computer and internet skills',
        created_at: '2025-01-01T00:00:00.000Z',
        total_trainings: 5,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSubjectWithStats(@Param('id') id: number) {
    return await this.subjectService.getSubjectWithStats(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update subject',
    description: 'Update subject details. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Subject ID', type: Number })
  @ApiBody({
    type: UpdateSubjectDto,
    description: 'Fields to update',
    examples: {
      example1: {
        summary: 'Sample update data',
        value: {
          name: 'Advanced Digital Literacy',
          description: 'Advanced computer and internet skills',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Advanced Digital Literacy',
        description: 'Advanced computer and internet skills',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSubject(
    @Param('id') id: number,
    @Body() updateDto: UpdateSubjectDto,
  ) {
    return await this.subjectService.updateSubject(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete subject',
    description: 'Delete subject by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Subject ID', type: Number })
  @ApiResponse({ status: 204, description: 'Subject deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete: subject is being used in trainings',
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSubject(@Param('id') id: number) {
    await this.subjectService.deleteSubject(id);
  }
}
