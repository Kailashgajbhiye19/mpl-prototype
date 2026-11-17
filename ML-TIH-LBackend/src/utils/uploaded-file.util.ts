import { BadRequestException } from '@nestjs/common';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
};

export function extensionForMimeType(mimeType: string): string {
  const extension = MIME_EXTENSIONS[mimeType];
  if (!extension) throw new BadRequestException('File type is not allowed');
  return extension;
}

export function validateFileSignature(mimeType: string, buffer: Buffer): void {
  const startsWith = (signature: number[]) =>
    buffer.length >= signature.length &&
    signature.every((byte, index) => buffer[index] === byte);

  const valid = (() => {
    switch (mimeType) {
      case 'image/jpeg':
        return startsWith([0xff, 0xd8, 0xff]);
      case 'image/png':
        return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      case 'image/gif':
        return (
          buffer
            .subarray(0, 6)
            .toString('ascii')
            .match(/^GIF8[79]a$/) !== null
        );
      case 'image/webp':
        return (
          buffer.length >= 12 &&
          buffer.toString('ascii', 0, 4) === 'RIFF' &&
          buffer.toString('ascii', 8, 12) === 'WEBP'
        );
      case 'application/pdf':
        return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
      case 'application/msword':
        return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return startsWith([0x50, 0x4b, 0x03, 0x04]);
      default:
        return false;
    }
  })();

  if (!valid)
    throw new BadRequestException(
      'File content does not match its declared type',
    );
}
