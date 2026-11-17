import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ReportModule } from '../report/report.module';
import { LocationModule } from '../location/location.module';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [ReportModule, LocationModule, TrainingModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
