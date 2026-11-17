import { BadRequestException } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService path validation', () => {
  const service = new FileUploadService();

  it('rejects path traversal when downloading a file', async () => {
    await expect(service.getFile('../.env')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.getFile('..\\.env')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to delete URLs from another origin', async () => {
    await expect(
      service.deleteFile('https://other.example/uploads/photo.png'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses URLs outside the uploads directory', async () => {
    await expect(
      service.deleteFile('http://localhost:6062/api/admin/1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
