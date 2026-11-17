import { Module } from '@nestjs/common';
import { AdminModule } from './modules/admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { TrainerModule } from './modules/trainer/trainer.module';
import { SubjectModule } from './modules/subject/subject.module';
import { LocationModule } from './modules/location/location.module';
import { TrainingModule } from './modules/training/training.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ReportModule } from './modules/report/report.module';

import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';
import { getJwtSecret } from './config/secrets';
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: 24 * 60 * 60, // 24 hours in seconds (86400 seconds)
      },
    }),
    AdminModule,
    TrainerModule,
    SubjectModule,
    LocationModule,
    TrainingModule,
    ParticipantModule,
    DashboardModule,
    FileUploadModule,
    ReportModule,

    PublicModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
