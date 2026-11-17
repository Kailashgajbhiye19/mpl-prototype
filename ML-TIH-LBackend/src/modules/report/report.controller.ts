import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { AuthGuard } from '../../utils/auth.guard';
import { ReportQueryDto } from './dto/report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get full dashboard report with filters' })
  @ApiQuery({
    name: 'district_cd',
    required: false,
    type: Number,
    description: 'Filter by district code',
  })
  @ApiQuery({
    name: 'block_cd',
    required: false,
    type: Number,
    description: 'Filter by block code',
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    type: String,
    description: 'From date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    type: String,
    description: 'To date (YYYY-MM-DD)',
  })
  async getDashboardReport(@Query() query: ReportQueryDto) {
    return this.reportService.getDashboardData(
      query.district_cd,
      query.block_cd,
      query.from_date,
      query.to_date,
    );
  }

  @Get('districts')
  @ApiOperation({ summary: 'Get list of districts for dropdown' })
  async getDistricts() {
    return this.reportService.getDistricts();
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get blocks for a district' })
  @ApiQuery({ name: 'district_cd', required: true, type: Number })
  async getBlocks(@Query('district_cd') district_cd: number) {
    return this.reportService.getBlocks(district_cd);
  }
}
