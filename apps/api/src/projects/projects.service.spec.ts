import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateProjectDto } from './dto/create-project.dto';

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
  };
  let permissionsService: {
    assertCanViewProject: jest.Mock;
    assertWorkspaceAdmin: jest.Mock;
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
    };

    permissionsService = {
      assertCanViewProject: jest.fn(),
      assertWorkspaceAdmin: jest.fn(),
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

  describe('findOne', () => {
    it('should throw NotFoundException if the project does not exist', async () => {
      projectRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if the user is not a workspace member', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProject.mockRejectedValue(
        new ForbiddenException('You are not a member of this workspace'),
      );

      await expect(service.findOne('project-1', 'non-member-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return the project when the user is a workspace member', async () => {
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOneBy.mockResolvedValue(project);
      permissionsService.assertCanViewProject.mockResolvedValue(undefined);

      const result = await service.findOne('project-1', 'member-id');

      expect(result).toEqual(project);
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
});
