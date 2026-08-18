import { Test, TestingModule } from '@nestjs/testing';
import { LabelsService } from './labels.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Label } from './entities/label.entity';

describe('LabelsService', () => {
  let service: LabelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LabelsService, { provide: getRepositoryToken(Label), useValue: {} }],
    }).compile();

    service = module.get<LabelsService>(LabelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
