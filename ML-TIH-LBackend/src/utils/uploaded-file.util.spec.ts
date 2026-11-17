import { BadRequestException } from '@nestjs/common';
import {
  extensionForMimeType,
  validateFileSignature,
} from './uploaded-file.util';

describe('uploaded-file utilities', () => {
  it('chooses a safe extension from the verified content type', () => {
    expect(extensionForMimeType('image/png')).toBe('.png');
    expect(extensionForMimeType('application/pdf')).toBe('.pdf');
  });

  it('rejects a file whose bytes do not match the declared MIME type', () => {
    expect(() =>
      validateFileSignature('image/png', Buffer.from('<script>')),
    ).toThrow(BadRequestException);
    expect(() =>
      validateFileSignature('application/pdf', Buffer.from('%PDF-1.7')),
    ).not.toThrow();
  });
});
