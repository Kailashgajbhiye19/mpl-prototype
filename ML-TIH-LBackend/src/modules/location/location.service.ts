import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationQueryDto,
} from './dto/location.dto';
import { dbPool } from '../../database/db.pool';
import { Location, LocationWithStats } from './interfaces/location.interface';

type QueryValue = string | number | Date | null;

@Injectable()
export class LocationService {
  // Create new location
  async createLocation(createDto: CreateLocationDto): Promise<Location> {
    const {
      village,
      block,
      district,
      state,
      pincode,
      latitude,
      longitude,
      address_line,
      district_cd,
      block_cd,
    } = createDto;

    try {
      const existing = await dbPool.query<{ id: number }>(
        'SELECT id FROM locations WHERE village = $1 AND block = $2 AND district = $3',
        [village, block, district],
      );
      if (existing.rows.length > 0) {
        throw new BadRequestException(
          'Location with same village/block/district already exists',
        );
      }
      // Insert new location
      const result = await dbPool.query<Location>(
        `INSERT INTO locations (village, block, district, state, pincode, latitude, longitude, address_line, district_cd, block_cd) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          village,
          block,
          district,
          state,
          pincode,
          latitude,
          longitude,
          address_line,
          district_cd,
          block_cd,
        ],
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Create location error:', error);
      throw new BadRequestException('Failed to create location');
    }
  }

  // Get all locations with optional filters
  async getAllLocations(queryDto: LocationQueryDto = {}): Promise<Location[]> {
    const {
      village,
      block,
      district,
      state,
      pincode,
      district_cd,
      block_cd,
      page = 1,
      limit = 10,
    } = queryDto;

    try {
      let query = `SELECT * FROM locations WHERE 1=1`;
      const params: QueryValue[] = [];
      let paramCount = 0;

      // Add filters
      if (village) {
        paramCount++;
        query += ` AND village ILIKE $${paramCount}`;
        params.push(`%${village}%`);
      }
      if (block) {
        paramCount++;
        query += ` AND block ILIKE $${paramCount}`;
        params.push(`%${block}%`);
      }
      if (district) {
        paramCount++;
        query += ` AND district ILIKE $${paramCount}`;
        params.push(`%${district}%`);
      }
      if (state) {
        paramCount++;
        query += ` AND state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }
      if (pincode) {
        paramCount++;
        query += ` AND pincode = $${paramCount}`;
        params.push(pincode);
      }
      if (district_cd) {
        paramCount++;
        query += ` AND district_cd = $${paramCount}`;
        params.push(district_cd);
      }
      if (block_cd) {
        paramCount++;
        query += ` AND block_cd = $${paramCount}`;
        params.push(block_cd);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit.toString()),
        (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
      );

      const result = await dbPool.query<Location>(query, params);
      return result.rows;
    } catch (error) {
      console.error('Get all locations error:', error);
      throw new BadRequestException('Failed to fetch locations');
    }
  }

  // Get location by ID
  async getLocationById(id: number): Promise<Location> {
    try {
      const result = await dbPool.query<Location>(
        'SELECT * FROM locations WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Location not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Get location by ID error:', error);
      throw new BadRequestException('Failed to fetch location');
    }
  }

  // Get location with statistics
  async getLocationWithStats(id: number): Promise<LocationWithStats> {
    try {
      const locationResult = await dbPool.query<Location>(
        'SELECT * FROM locations WHERE id = $1',
        [id],
      );

      if (locationResult.rows.length === 0) {
        throw new NotFoundException('Location not found');
      }

      // Get statistics (total trainings at this location)
      const statsResult = await dbPool.query<{ total_trainings: string }>(
        `
        SELECT COUNT(id) as total_trainings
        FROM trainings 
        WHERE location_id = $1
      `,
        [id],
      );

      const location = locationResult.rows[0];
      const stats = statsResult.rows[0];

      return {
        ...location,
        total_trainings: parseInt(stats.total_trainings),
      };
    } catch (error) {
      console.error('Get location with stats error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch location with statistics');
    }
  }

  // Update location
  async updateLocation(
    id: number,
    updateDto: UpdateLocationDto,
  ): Promise<Location> {
    const {
      village,
      block,
      district,
      state,
      pincode,
      latitude,
      longitude,
      address_line,
      district_cd,
      block_cd,
    } = updateDto;

    try {
      // Build dynamic query
      const updates: string[] = [];
      const params: QueryValue[] = [];
      let paramCount = 0;

      if (village !== undefined) {
        paramCount++;
        updates.push(`village = $${paramCount}`);
        params.push(village);
      }
      if (block !== undefined) {
        paramCount++;
        updates.push(`block = $${paramCount}`);
        params.push(block);
      }
      if (district !== undefined) {
        paramCount++;
        updates.push(`district = $${paramCount}`);
        params.push(district);
      }
      if (state !== undefined) {
        paramCount++;
        updates.push(`state = $${paramCount}`);
        params.push(state);
      }
      if (pincode !== undefined) {
        paramCount++;
        updates.push(`pincode = $${paramCount}`);
        params.push(pincode);
      }
      if (latitude !== undefined) {
        paramCount++;
        updates.push(`latitude = $${paramCount}`);
        params.push(latitude);
      }
      if (longitude !== undefined) {
        paramCount++;
        updates.push(`longitude = $${paramCount}`);
        params.push(longitude);
      }
      if (address_line !== undefined) {
        paramCount++;
        updates.push(`address_line = $${paramCount}`);
        params.push(address_line);
      }
      if (district_cd !== undefined) {
        paramCount++;
        updates.push(`district_cd = $${paramCount}`);
        params.push(district_cd);
      }
      if (block_cd !== undefined) {
        paramCount++;
        updates.push(`block_cd = $${paramCount}`);
        params.push(block_cd);
      }

      if (updates.length === 0) {
        // No fields to update, return current location
        return await this.getLocationById(id);
      }

      // Add ID parameter
      paramCount++;
      params.push(id);

      const query = `UPDATE locations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await dbPool.query<Location>(query, params);

      if (result.rows.length === 0) {
        throw new NotFoundException('Location not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Update location error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update location');
    }
  }

  // Delete location
  async deleteLocation(id: number): Promise<void> {
    try {
      // Check if location is being used in any training
      const trainingCheck = await dbPool.query<{ id: number }>(
        'SELECT id FROM trainings WHERE location_id = $1 LIMIT 1',
        [id],
      );

      if (trainingCheck.rows.length > 0) {
        throw new BadRequestException(
          'Cannot delete location: it is being used in trainings',
        );
      }

      const result = await dbPool.query<{ id: number }>(
        'DELETE FROM locations WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Location not found');
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Delete location error:', error);
      throw new BadRequestException('Failed to delete location');
    }
  }
}
