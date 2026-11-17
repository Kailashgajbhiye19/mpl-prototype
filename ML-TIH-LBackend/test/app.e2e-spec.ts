import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HealthService } from './../src/modules/health/health.service';

describe('Marketplace Literacy API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HealthService)
      .useValue({
        check: jest
          .fn()
          .mockResolvedValue({ status: 'ok', database: 'connected' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the health route without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'connected' });
  });

  it('requires JWT authentication for dashboard data', async () => {
    await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .expect(401);
  });

  it('requires JWT authentication for the training directory', async () => {
    await request(app.getHttpServer()).get('/api/trainings').expect(401);
  });
});
