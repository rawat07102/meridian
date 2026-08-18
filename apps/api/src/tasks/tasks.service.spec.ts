import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateTaskDto } from './dto/create-task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let projectRepository: {
    findOne: jest.Mock;
  };
  let permissionsService: {
    assertProjectMember: jest.Mock;
    assertCanViewProject: jest.Mock;
    assertCanDeleteTask: jest.Mock;
  };

  beforeEach(async () => {
    taskRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    projectRepository = {
      findOne: jest.fn(),
    };

    permissionsService = {
      assertProjectMember: jest.fn(),
      assertCanViewProject: jest.fn(),
      assertCanDeleteTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { title: 'New task', priority: 'medium' } as CreateTaskDto;

    it('should throw NotFoundException if the project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.create('nonexistent-project', 'user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the user is not a project member', async () => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockRejectedValue(
        new ForbiddenException('You are not a member of this project'),
      );

      await expect(service.create('project-1', 'non-member', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should set position to 1000 when it is the first task in Backlog', async () => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.findOne.mockResolvedValue(null); // no existing tasks in Backlog
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.create('project-1', 'user-1', dto);

      expect(result.position).toBe(1000);
      expect(result.status).toBe(TaskStatus.BACKLOG);
    });

    it('should set position to previous + 1000 when tasks already exist in Backlog', async () => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.findOne.mockResolvedValue({ position: 2000 }); // last task in Backlog
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.create('project-1', 'user-1', dto);

      expect(result.position).toBe(3000);
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if the user is not Lead or Admin', async () => {
      const task = { id: 'task-1', projectId: 'project-1' };
      taskRepository.findOne.mockResolvedValue(task);
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', leadId: 'lead-id' });
      permissionsService.assertCanDeleteTask.mockRejectedValue(
        new ForbiddenException('Only the project Lead or a workspace Admin can delete tasks'),
      );

      await expect(service.remove('task-1', 'regular-member-id')).rejects.toThrow(
        ForbiddenException,
      );
      expect(taskRepository.remove).not.toHaveBeenCalled();
    });

    it('should remove the task when the user is the project Lead', async () => {
      const task = { id: 'task-1', projectId: 'project-1' };
      taskRepository.findOne.mockResolvedValue(task);
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', leadId: 'lead-id' });
      permissionsService.assertCanDeleteTask.mockResolvedValue(undefined);
      taskRepository.remove.mockResolvedValue(task);

      await service.remove('task-1', 'lead-id');

      expect(taskRepository.remove).toHaveBeenCalledWith(task);
    });
  });
});
