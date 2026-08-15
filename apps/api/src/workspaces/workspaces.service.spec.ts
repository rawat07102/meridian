import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let workspaceRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };
  let workspaceMemberRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    workspaceRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    workspaceMemberRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepository },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: workspaceMemberRepository,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create the workspace and add the creator as an Admin member', async () => {
      const userId = 'user-1';
      const dto = { name: 'My Workspace' };

      workspaceRepository.save.mockResolvedValue({
        id: 'workspace-1',
        name: dto.name,
        ownerId: userId,
      });
      workspaceMemberRepository.save.mockResolvedValue({});

      const result = await service.create(userId, dto);

      expect(workspaceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: dto.name, ownerId: userId }),
      );
      expect(workspaceMemberRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          workspaceId: 'workspace-1',
          role: WorkspaceRole.ADMIN,
        }),
      );
      expect(result.id).toBe('workspace-1');
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if the user is not the owner', async () => {
      const workspace = { id: 'workspace-1', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);

      await expect(service.remove('workspace-1', 'not-the-owner')).rejects.toThrow(
        ForbiddenException,
      );
      expect(workspaceRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the workspace does not exist', async () => {
      workspaceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should remove the workspace when called by the owner', async () => {
      const workspace = { id: 'workspace-1', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      workspaceRepository.remove.mockResolvedValue(workspace);

      await service.remove('workspace-1', 'owner-id');

      expect(workspaceRepository.remove).toHaveBeenCalledWith(workspace);
    });
  });
});
