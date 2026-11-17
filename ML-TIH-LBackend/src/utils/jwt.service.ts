import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from '../config/secrets';

@Injectable()
export class CustomJwtService {
  constructor(private jwtService: JwtService) {}

  // Generate JWT token
  generateToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: getJwtSecret(),
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '24h'),
    });
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: getJwtSecret(),
      });
    } catch {
      throw new Error('Invalid token');
    }
  }
}
