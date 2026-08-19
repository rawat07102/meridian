import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { GuestJwtPayload } from '../auth/interfaces/guest-jwt-payload.interface';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };
  let projectMemberRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };
  let permissionsService: {
    assertWorkspaceAdmin: jest.Mock;
    assertWorkspaceMember: jest.Mock;
    assertCanViewProjectAsUserOrGuest: jest.Mock;
  };

  beforeEach(async () => {
    projectRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    projectMemberRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    permissionsService = {
      assertCanViewProjectAsUserOrGuest: jest.fn(),
      assertWorkspaceAdmin: jest.fn(),
      assertWorkspaceMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        { provide: getRepositoryToken(ProjectMember), useValue: projectMemberRepository },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create the project and add the lead as a ProjectMember', async () => {
      const dto = { leadId: 'lead-user-id' } as CreateProjectDto;
      projectRepository.save.mockResolvedValue({ id: 'project-1', ...dto });
      projectMemberRepository.findOneBy.mockResolvedValue(null); // not already a member
      projectMemberRepository.save.mockResolvedValue({});

      const result = await service.create('workspace-1', 'creator-id', dto);

      expect(projectMemberRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'project-1', userId: 'lead-user-id' }),
      );
      expect(result.id).toBe('project-1');
    });

    it('should not duplicate a ProjectMember row if the lead is already a member', async () => {
      const dto = { leadId: 'lead-user-id' } as CreateProjectDto;
      projectRepository.save.mockResolvedValue({ id: 'project-1', ...dto });
      projectMemberRepository.findOneBy.mockResolvedValue({ id: 'existing-member' });

      await service.create('workspace-1', 'creator-id', dto);

      expect(projectMemberRepository.save).not.toHaveBeenCalled();
    });
  });

  // Replace the old findOne describe block in projects.service.spec.ts with this.
  // Requires permissionsService mock to include: assertCanViewProjectAsUserOrGuest: jest.Mock
  // (in addition to the existing assertWorkspaceAdmin mock)

  describe('findOne', () => {
    it('should throw NotFoundException if the project does not exist', async () => {
      projectRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', { id: 'user-1' } as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if a regular user is not a workspace member', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockRejectedValue(
        new ForbiddenException('You are not a member of this workspace'),
      );

      await expect(service.findOne('project-1', { id: 'non-member-id' } as User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return the project for a workspace member', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);

      const result = await service.findOne('project-1', { id: 'member-id' } as User);

      expect(result).toEqual(project);
    });

    it("should return the project for a guest scoped to the project's workspace", async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);

      const guestPayload = { role: 'guest', workspaceId: 'workspace-1' };
      const result = await service.findOne('project-1', guestPayload as GuestJwtPayload);

      expect(result).toEqual(project);
      expect(permissionsService.assertCanViewProjectAsUserOrGuest).toHaveBeenCalledWith(
        guestPayload,
        project,
      );
    });

    it('should throw ForbiddenException for a guest scoped to a different workspace', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockRejectedValue(
        new ForbiddenException('This guest link does not grant access to this workspace'),
      );

      const guestPayload = { role: 'guest', workspaceId: 'different-workspace-id' };

      await expect(service.findOne('project-1', guestPayload as GuestJwtPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  describe('changeLead', () => {
    it('should update leadId and add the new lead as a ProjectMember if not already one', async () => {
      const project = { id: 'project-1', leadId: 'old-lead-id', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      projectMemberRepository.findOneBy.mockResolvedValue(null);
      projectMemberRepository.save.mockResolvedValue({});
      projectRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.changeLead('project-1', 'new-lead-id');

      expect(result.leadId).toBe('new-lead-id');
      expect(projectMemberRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'project-1', userId: 'new-lead-id' }),
      );
    });
  });

  describe('addMember', () => {
    it('should not add if the new user is not a workspace member', async () => {
      projectRepository.findOneBy.mockResolvedValue({ id: 'project-1' });
      projectMemberRepository.findOneBy.mockResolvedValue(null);
      permissionsService.assertWorkspaceMember.mockRejectedValue(
        new ForbiddenException('You are not a member of this workspace'),
      );

      await expect(service.addMember('project-1', 'new-user-id')).rejects.toThrow(
        ForbiddenException,
      );
      expect(projectMemberRepository.save).not.toHaveBeenCalled();
    });

    it('should add the new user as project member if they are a workspace member', async () => {
      projectRepository.findOneBy.mockResolvedValue({ projectId: 'project-1' });
      projectMemberRepository.findOneBy.mockResolvedValue(null);
      permissionsService.assertWorkspaceMember.mockResolvedValue(undefined);
      projectMemberRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.addMember('project-1', 'new-user-id');

      expect(result.projectId).toBe('project-1');
      expect(result.userId).toBe('new-user-id');
      expect(projectMemberRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          userId: 'new-user-id',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if the user is not a workspace admin', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertWorkspaceAdmin.mockRejectedValue(
        new ForbiddenException('Only workspace admins can perform this action'),
      );

      await expect(service.remove('project-1', 'non-admin-id')).rejects.toThrow(ForbiddenException);
      expect(projectRepository.remove).not.toHaveBeenCalled();
    });

    it('should remove the project when the user is a workspace admin', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertWorkspaceAdmin.mockResolvedValue(undefined);
      projectRepository.remove.mockResolvedValue(project);

      await service.remove('project-1', 'admin-id');

      expect(projectRepository.remove).toHaveBeenCalledWith(project);
    });
  });

  describe('removeMember', () => {
    it('should throw ForbiddenException if the user is project lead', async () => {
      const project = { id: 'project-id', leadId: 'lead-id' };
      const member = { projectId: 'project-id', userId: 'lead-id' };
      projectRepository.findOneBy.mockResolvedValue(project);
      projectMemberRepository.findOneBy.mockResolvedValue(member);
      await expect(service.removeMember('project-id', 'lead-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove member if user is a member', async () => {
      const project = { id: 'project-id', leadId: 'lead-id' };
      const member = { projectId: 'project-id', userId: 'member-id' };
      projectRepository.findOneBy.mockResolvedValue(project);
      projectMemberRepository.findOneBy.mockResolvedValue(member);
      projectMemberRepository.save.mockResolvedValue({});

      await service.removeMember('project-id', 'member-id');

      expect(projectMemberRepository.remove).toHaveBeenCalledWith(member);
    });
  });

  describe('leave', () => {
    it('should throw ForbiddenException if the user is project lead', async () => {
      const project = { id: 'project-id', leadId: 'lead-id' };
      const member = { projectId: 'project-id', userId: 'lead-id' };
      projectRepository.findOneBy.mockResolvedValue(project);
      projectMemberRepository.findOneBy.mockResolvedValue(member);
      await expect(service.leave('project-id', 'lead-id')).rejects.toThrow(ForbiddenException);
    });

    it('should remove member if user is a member', async () => {
      const project = { id: 'project-id', leadId: 'lead-id' };
      const member = { projectId: 'project-id', userId: 'member-id' };
      projectRepository.findOneBy.mockResolvedValue(project);
      projectMemberRepository.findOneBy.mockResolvedValue(member);
      projectMemberRepository.save.mockResolvedValue({});

      await service.removeMember('project-id', 'member-id');

      expect(projectMemberRepository.remove).toHaveBeenCalledWith(member);
    });
  });
});
