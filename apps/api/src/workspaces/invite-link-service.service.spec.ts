import { Test, TestingModule } from '@nestjs/testing';
import { InviteLinkServiceService } from './invite-link-service.service';

describe('InviteLinkServiceService', () => {
  let service: InviteLinkServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InviteLinkServiceService],
    }).compile();

    service = module.get<InviteLinkServiceService>(InviteLinkServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
