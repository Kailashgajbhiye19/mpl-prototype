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
import { LocationService } from './location.service';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationQueryDto,
} from './dto/location.dto';
import { AuthGuard } from '../../utils/auth.guard';

@ApiTags('Location')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new location',
    description: 'Create a new location. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateLocationDto,
    description: 'New location details',
    examples: {
      example1: {
        summary: 'Sample location creation',
        value: {
          village: 'Chingali',
          block: 'Khairagarh',
          district: 'Khairagarh-Chhuikhadan-Gandai',
          state: 'Chhattisgarh',
          pincode: '495689',
          latitude: 21.5678,
          longitude: 81.2345,
          address_line: 'Main Road, Chingali Village',
          district_cd: 1,
          block_cd: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully',
    schema: {
      example: {
        id: 1,
        village: 'Chingali',
        block: 'Khairagarh',
        district: 'Khairagarh-Chhuikhadan-Gandai',
        state: 'Chhattisgarh',
        pincode: '495689',
        latitude: 21.5678,
        longitude: 81.2345,
        address_line: 'Main Road, Chingali Village',
        district_cd: 1,
        block_cd: 1,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createLocation(@Body() createDto: CreateLocationDto) {
    return await this.locationService.createLocation(createDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all locations',
    description:
      'Get list of all locations with optional filters. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'village',
    required: false,
    description: 'Filter by village',
    type: String,
  })
  @ApiQuery({
    name: 'block',
    required: false,
    description: 'Filter by block',
    type: String,
  })
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter by district',
    type: String,
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter by state',
    type: String,
  })
  @ApiQuery({
    name: 'pincode',
    required: false,
    description: 'Filter by pincode',
    type: String,
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
    description: 'List of locations retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          village: 'Chingali',
          block: 'Khairagarh',
          district: 'Khairagarh-Chhuikhadan-Gandai',
          state: 'Chhattisgarh',
          pincode: '495689',
          latitude: 21.5678,
          longitude: 81.2345,
          address_line: 'Main Road, Chingali Village',
          district_cd: 1,
          block_cd: 1,
          created_at: '2025-01-01T00:00:00.000Z',
          country_name: 'India',
          country_code: 'IND',
          state_name: 'Chhattisgarh',
          state_code: '22',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllLocations(@Query() queryDto: LocationQueryDto) {
    return await this.locationService.getAllLocations(queryDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get location by ID',
    description:
      'Get specific location details by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Location ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Location details retrieved successfully',
    schema: {
      example: {
        id: 1,
        village: 'Chingali',
        block: 'Khairagarh',
        district: 'Khairagarh-Chhuikhadan-Gandai',
        state: 'Chhattisgarh',
        pincode: '495689',
        latitude: 21.5678,
        longitude: 81.2345,
        address_line: 'Main Road, Chingali Village',
        district_cd: 1,
        block_cd: 1,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLocationById(@Param('id') id: number) {
    return await this.locationService.getLocationById(id);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get location with statistics',
    description:
      'Get location details with training statistics. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Location ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Location with statistics retrieved successfully',
    schema: {
      example: {
        id: 1,
        village: 'Chingali',
        block: 'Khairagarh',
        district: 'Khairagarh-Chhuikhadan-Gandai',
        state: 'Chhattisgarh',
        pincode: '495689',
        latitude: 21.5678,
        longitude: 81.2345,
        address_line: 'Main Road, Chingali Village',
        district_cd: 1,
        block_cd: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        total_trainings: 5,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLocationWithStats(@Param('id') id: number) {
    return await this.locationService.getLocationWithStats(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update location',
    description: 'Update location details. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Location ID', type: Number })
  @ApiBody({
    type: UpdateLocationDto,
    description: 'Fields to update',
    examples: {
      example1: {
        summary: 'Sample update data',
        value: {
          village: 'Chingali Updated',
          latitude: 21.568,
          longitude: 81.235,
          district_cd: 2,
          block_cd: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    schema: {
      example: {
        id: 1,
        village: 'Chingali Updated',
        block: 'Khairagarh',
        district: 'Khairagarh-Chhuikhadan-Gandai',
        state: 'Chhattisgarh',
        pincode: '495689',
        latitude: 21.568,
        longitude: 81.235,
        address_line: 'Main Road, Chingali Village',
        district_cd: 2,
        block_cd: 2,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateLocation(
    @Param('id') id: number,
    @Body() updateDto: UpdateLocationDto,
  ) {
    return await this.locationService.updateLocation(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete location',
    description: 'Delete location by ID. Requires a valid JWT token.',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Location ID', type: Number })
  @ApiResponse({ status: 204, description: 'Location deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete: location is being used in trainings',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteLocation(@Param('id') id: number) {
    await this.locationService.deleteLocation(id);
  }
}
