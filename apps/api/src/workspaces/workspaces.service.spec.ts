import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { PermissionsService } from '../permissions/permissions.service';

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
    remove: jest.Mock;
  };
  let permissionsService: {
    assertWorkspaceAdmin: jest.Mock;
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
      remove: jest.fn(),
    };

    permissionsService = {
      assertWorkspaceAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepository },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: workspaceMemberRepository,
        },
        {
          provide: PermissionsService,
          useValue: permissionsService,
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

  describe('transferOwnership', () => {
    it('should throw ForbiddenException if the caller is not the current owner', async () => {
      const workspace = { id: 'workspace-id', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      await expect(
        service.transferOwnership('workspace-id', 'not-the-owner', 'new-owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if the new owner is not an admin', async () => {
      const workspace = { id: 'workspace-id', ownerId: 'owner-id' };

      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      permissionsService.assertWorkspaceAdmin.mockRejectedValue(new ForbiddenException());
      await expect(
        service.transferOwnership('workspace-id', 'owner-id', 'non-admin-id'),
      ).rejects.toThrow('Workspaces can only be transferred to an Admin');
    });

    it('should update the ownerId when the caller is owner and the new owner is an admin', async () => {
      const workspace = { id: 'workspace-id', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      permissionsService.assertWorkspaceAdmin.mockResolvedValue(undefined);
      workspaceRepository.save.mockImplementation((w) => Promise.resolve(w));

      const result = await service.transferOwnership('workspace-id', 'owner-id', 'new-owner-id');
      expect(result.ownerId).toBe('new-owner-id');
      expect(workspaceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'new-owner-id' }),
      );
    });
  });

  describe('leave', () => {
    it('should throw ForbiddenException if the owner tries to leave', async () => {
      const workspace = { id: 'workspace-1', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);

      await expect(service.leave('workspace-1', 'owner-id')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if the user is not a member', async () => {
      const workspace = { id: 'workspace-1', ownerId: 'owner-id' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      workspaceMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.leave('workspace-1', 'non-member-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove the WorkspaceMember row for a non-owner member', async () => {
      const workspace = { id: 'workspace-1', ownerId: 'owner-id' };
      const member = { id: 'member-1', userId: 'member-user-id', workspaceId: 'workspace-1' };
      workspaceRepository.findOneBy.mockResolvedValue(workspace);
      workspaceMemberRepository.findOne.mockResolvedValue(member);
      workspaceMemberRepository.remove.mockResolvedValue(member);

      await service.leave('workspace-1', 'member-user-id');

      expect(workspaceMemberRepository.remove).toHaveBeenCalledWith(member);
    });
  });
});
