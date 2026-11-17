import { Test, TestingModule } from '@nestjs/testing';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('PublicController', () => {
  let controller: PublicController;
  const publicService = {
    getDistricts: jest.fn(),
    getBlocks: jest.fn(),
    getLocations: jest.fn(),
    getTrainings: jest.fn(),
    getTrainersGallery: jest.fn(),
    getTrainingsGallery: jest.fn(),
    getCombinedGallery: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [{ provide: PublicService, useValue: publicService }],
    }).compile();

    controller = module.get<PublicController>(PublicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates district requests to the public service', async () => {
    publicService.getDistricts.mockResolvedValue([{ district_cd: 1 }]);

    await expect(controller.getDistricts()).resolves.toEqual([
      { district_cd: 1 },
    ]);
    expect(publicService.getDistricts).toHaveBeenCalledTimes(1);
  });

  it('normalizes gallery pagination before delegating', async () => {
    publicService.getTrainersGallery.mockResolvedValue({ data: [] });

    await controller.getTrainersGallery(
      '2' as unknown as number,
      '25' as unknown as number,
    );

    expect(publicService.getTrainersGallery).toHaveBeenCalledWith(2, 25);
  });
});
