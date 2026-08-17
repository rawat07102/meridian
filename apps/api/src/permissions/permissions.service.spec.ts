import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let workspaceMemberRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    workspaceMemberRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: workspaceMemberRepository,
        },
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: getRepositoryToken(ProjectMember), useValue: {} },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaceRoleRank', () => {
    it('should return 2 for an Admin', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      const rank = await service.getWorkspaceRoleRank('user-1', 'workspace-1');

      expect(rank).toBe(2);
    });

    it('should return 1 for a Member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.MEMBER,
      });

      const rank = await service.getWorkspaceRoleRank('user-1', 'workspace-1');

      expect(rank).toBe(1);
    });

    it('should return 0 for a non-member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue(null);

      const rank = await service.getWorkspaceRoleRank('user-1', 'workspace-1');

      expect(rank).toBe(0);
    });
  });

  describe('isWorkspaceAdmin', () => {
    it('should return true for an Admin', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      await expect(service.isWorkspaceAdmin('user-1', 'workspace-1')).resolves.toBe(true);
    });

    it('should return false for a Member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.isWorkspaceAdmin('user-1', 'workspace-1')).resolves.toBe(false);
    });

    it('should return false for a non-member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.isWorkspaceAdmin('user-1', 'workspace-1')).resolves.toBe(false);
    });
  });

  describe('assertWorkspaceAdmin', () => {
    it('should not throw for an Admin', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      await expect(service.assertWorkspaceAdmin('user-1', 'workspace-1')).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for a Member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.assertWorkspaceAdmin('user-1', 'workspace-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for a non-member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.assertWorkspaceAdmin('user-1', 'workspace-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('assertWorkspaceMember', () => {
    it('should not throw for a Member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.assertWorkspaceMember('user-1', 'workspace-1')).resolves.toBeUndefined();
    });

    it('should not throw for an Admin (higher rank satisfies member requirement)', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      await expect(service.assertWorkspaceMember('user-1', 'workspace-1')).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for a non-member', async () => {
      workspaceMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.assertWorkspaceMember('user-1', 'workspace-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
