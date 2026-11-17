// src/modules/file-upload/file-upload.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Param,
  Res,
  Query,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../../utils/auth.guard';
import type { Response } from 'express'; // Use 'type' import

@ApiTags('File Upload')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload single file',
    description: 'Upload a single file. Requires a valid JWT token.',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
  ) {
    return await this.fileUploadService.uploadFile(file, uploadDto);
  }

  @Post('upload-multiple')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Upload up to 10 files at once. Requires a valid JWT token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: FileUploadDto,
  ) {
    return await this.fileUploadService.uploadMultipleFiles(files, uploadDto);
  }

  @Get(':filename')
  @ApiOperation({
    summary: 'Download file',
    description: 'Download file by filename',
  })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const fileBuffer = await this.fileUploadService.getFile(filename);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileBuffer.length,
    });
    res.send(fileBuffer);
  }

  @Delete('delete')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete file',
    description: 'Delete file by URL. Requires a valid JWT token.',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteFile(@Query('file_url') fileUrl: string) {
    await this.fileUploadService.deleteFile(fileUrl);
    return { message: 'File deleted successfully' };
  }
}
