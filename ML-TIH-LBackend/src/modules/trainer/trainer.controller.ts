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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { TrainerService } from './trainer.service';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerQueryDto,
} from './dto/trainer.dto';
import { AuthGuard } from '../../utils/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Trainer')
@Controller('trainers')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  // ============================
  // CREATE TRAINER (NOW SUPPORTS IMAGE ALSO)
  // ============================
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }),
  ) // âœ… allow image
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new trainer (with optional image)' })
  @ApiBearerAuth()
  async createTrainer(
    @Body() createDto: CreateTrainerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.trainerService.createTrainerWithImage(createDto, file);
  }

  // ============================
  // GET ALL TRAINERS
  // ============================
  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getAllTrainers(@Query() queryDto: TrainerQueryDto) {
    return await this.trainerService.getAllTrainers(queryDto);
  }

  // ============================
  // GET TRAINER BY ID
  // ============================
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getTrainerById(@Param('id') id: number) {
    return await this.trainerService.getTrainerById(id);
  }

  // ============================
  // UPDATE TRAINER
  // ============================
  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async updateTrainer(
    @Param('id') id: number,
    @Body() updateDto: UpdateTrainerDto,
  ) {
    return await this.trainerService.updateTrainer(id, updateDto);
  }

  // ============================
  // DELETE TRAINER
  // ============================
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTrainer(@Param('id') id: number) {
    await this.trainerService.deleteTrainer(id);
  }

  // ============================
  // UPLOAD TRAINER PHOTO (STILL WORKS)
  // ============================
  @Post(':id/upload-photo')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload trainer photo' })
  async uploadTrainerPhoto(
    @Param('id') trainerId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return await this.trainerService.uploadTrainerPhoto(trainerId, file);
  }
}
