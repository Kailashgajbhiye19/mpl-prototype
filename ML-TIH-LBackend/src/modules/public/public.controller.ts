import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public Gallery & Info')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // 🔓 Public Districts
  @Get('districts')
  @ApiOperation({ summary: 'Get all public districts' })
  async getDistricts() {
    return this.publicService.getDistricts();
  }

  // 🔓 Public Blocks
  @Get('blocks')
  @ApiOperation({ summary: 'Get blocks by district' })
  @ApiQuery({ name: 'district_cd', required: true, type: Number })
  async getBlocks(@Query('district_cd') district_cd: number) {
    return this.publicService.getBlocks(district_cd);
  }

  // 🔓 Public Locations
  @Get('locations')
  @ApiOperation({ summary: 'Get public locations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLocations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.publicService.getLocations(page, limit);
  }

  // 🔓 Public Trainings List
  @Get('trainings')
  @ApiOperation({ summary: 'Get all public trainings' })
  async getTrainings() {
    return this.publicService.getTrainings();
  }

  // =========================================================================
  // 🖼️ 🔓 TRAINERS GALLERY ENDPOINT (Choice 1)
  // =========================================================================
  @Get('gallery/trainers')
  @ApiOperation({
    summary: 'Get Trainers Photo Gallery (Choice 1 Endpoint)',
    description:
      'Retrieves all photos from trainers table and uploads/trainers directory',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description:
      'List of trainer photos with public URLs and pagination metadata',
  })
  async getTrainersGallery(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.publicService.getTrainersGallery(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  // =========================================================================
  // 🖼️ 🔓 TRAININGS GALLERY ENDPOINT (Choice 1)
  // =========================================================================
  @Get('gallery/trainings')
  @ApiOperation({
    summary: 'Get Trainings Photo Gallery (Choice 1 Endpoint)',
    description:
      'Retrieves all photos from training center/participant tables and uploads/trainings directory',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description:
      'List of training photos with public URLs and pagination metadata',
  })
  async getTrainingsGallery(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.publicService.getTrainingsGallery(
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  // =========================================================================
  // 🖼️ 🔓 COMBINED UNIFIED GALLERY ENDPOINT
  // =========================================================================
  @Get('gallery')
  @ApiOperation({
    summary: 'Get Combined Gallery Photos',
    description:
      'Retrieves photos from both trainers and trainings, with optional category filter',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    enum: ['trainers', 'trainings'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getGallery(
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.publicService.getCombinedGallery(
      Number(page) || 1,
      Number(limit) || 50,
      category,
    );
  }
}
