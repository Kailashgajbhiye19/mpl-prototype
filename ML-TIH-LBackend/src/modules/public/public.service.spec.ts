import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { ReportService } from '../report/report.service';
import { LocationService } from '../location/location.service';
import { TrainingService } from '../training/training.service';

describe('PublicService', () => {
  let service: PublicService;
  const reportService = {
    getDistricts: jest.fn(),
    getBlocks: jest.fn(),
  };
  const locationService = { getAllLocations: jest.fn() };
  const trainingService = { getAllTrainings: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: ReportService, useValue: reportService },
        { provide: LocationService, useValue: locationService },
        { provide: TrainingService, useValue: trainingService },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates district and block queries to the report service', async () => {
    reportService.getDistricts.mockResolvedValue([{ district_cd: 10 }]);
    reportService.getBlocks.mockResolvedValue([{ block_cd: 20 }]);

    await expect(service.getDistricts()).resolves.toEqual([
      { district_cd: 10 },
    ]);
    await expect(service.getBlocks(10)).resolves.toEqual([{ block_cd: 20 }]);
    expect(reportService.getBlocks).toHaveBeenCalledWith(10);
  });

  it('passes pagination through to the location service', async () => {
    locationService.getAllLocations.mockResolvedValue({ data: [] });

    await service.getLocations(3, 15);

    expect(locationService.getAllLocations).toHaveBeenCalledWith({
      page: 3,
      limit: 15,
    });
  });

  it('delegates training queries to the training service', async () => {
    trainingService.getAllTrainings.mockResolvedValue([]);

    await expect(service.getTrainings()).resolves.toEqual([]);
    expect(trainingService.getAllTrainings).toHaveBeenCalledTimes(1);
  });
});
