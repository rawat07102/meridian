import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    assertCanAssignTask: jest.Mock;
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
      assertCanAssignTask: jest.fn(),
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

  describe('updateStatus', () => {
    it('should update status and append to the end of the new status column', async () => {
      const task = { id: 'task-1', projectId: 'project-1', status: TaskStatus.TODO, position: 500 };
      taskRepository.findOne
        .mockResolvedValueOnce(task) // fetchTaskOrFail
        .mockResolvedValueOnce({ position: 2000 }); // getNextPosition lookup in IN_PROGRESS column
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.updateStatus('task-1', 'user-1', {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.position).toBe(3000);
    });

    it('should set position to 1000 if the new status column is empty', async () => {
      const task = { id: 'task-1', projectId: 'project-1', status: TaskStatus.TODO, position: 500 };
      taskRepository.findOne.mockResolvedValueOnce(task).mockResolvedValueOnce(null); // no tasks in target column yet
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.updateStatus('task-1', 'user-1', {
        status: TaskStatus.DONE,
      });

      expect(result.position).toBe(1000);
    });
  });

  describe('reorder', () => {
    const baseTask = {
      id: 'task-1',
      projectId: 'project-1',
      status: TaskStatus.TODO,
      position: 500,
    };

    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
    });

    it('should set position to 1000 when moved into an empty column', async () => {
      taskRepository.findOne.mockResolvedValueOnce(baseTask); // fetchTaskOrFail

      const result = await service.reorder('task-1', 'user-1', {
        newStatus: TaskStatus.DONE,
      });

      expect(result.position).toBe(1000);
    });

    it('should set position to nextTask.position - 1000 when moved to the top', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(baseTask) // fetchTaskOrFail
        .mockResolvedValueOnce(null) // prevTask lookup (none)
        .mockResolvedValueOnce({ position: 2000 }); // nextTask lookup

      const result = await service.reorder('task-1', 'user-1', {
        newStatus: TaskStatus.DONE,
        nextTaskId: 'next-task-id',
      });

      expect(result.position).toBe(1000); // 2000 - 1000
    });

    it('should set position to prevTask.position + 1000 when moved to the bottom', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(baseTask) // fetchTaskOrFail
        .mockResolvedValueOnce({ position: 2000 }) // prevTask lookup
        .mockResolvedValueOnce(null); // nextTask lookup (none)

      const result = await service.reorder('task-1', 'user-1', {
        newStatus: TaskStatus.DONE,
        prevTaskId: 'prev-task-id',
      });

      expect(result.position).toBe(3000); // 2000 + 1000
    });

    it('should set position to the midpoint when moved between two tasks', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(baseTask) // fetchTaskOrFail
        .mockResolvedValueOnce({ position: 2000 }) // prevTask lookup
        .mockResolvedValueOnce({ position: 3000 }); // nextTask lookup

      const result = await service.reorder('task-1', 'user-1', {
        newStatus: TaskStatus.DONE,
        prevTaskId: 'prev-task-id',
        nextTaskId: 'next-task-id',
      });

      expect(result.position).toBe(2500); // (2000 + 3000) / 2
    });

    it('should update status alongside position', async () => {
      taskRepository.findOne.mockResolvedValueOnce(baseTask);

      const result = await service.reorder('task-1', 'user-1', {
        newStatus: TaskStatus.IN_REVIEW,
      });

      expect(result.status).toBe(TaskStatus.IN_REVIEW);
    });
  });

  describe('assign', () => {
    const baseTask = {
      id: 'task-1',
      projectId: 'project-1',
      creatorId: 'creator-id',
      assignees: [],
    };

    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', leadId: 'lead-id' });
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
    });

    it('should allow a project member to self-assign', async () => {
      taskRepository.findOne.mockResolvedValue({ ...baseTask, assignees: [] });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);

      const result = await service.assign('task-1', 'member-id', 'member-id');

      expect(permissionsService.assertProjectMember).toHaveBeenCalled();
      expect(permissionsService.assertCanAssignTask).not.toHaveBeenCalled();
      expect(result.assignees.some((a: { id: string }) => a.id === 'member-id')).toBe(true);
    });

    it('should throw ForbiddenException if a regular member tries to assign someone else', async () => {
      taskRepository.findOne.mockResolvedValue({ ...baseTask, assignees: [] });
      permissionsService.assertCanAssignTask.mockRejectedValue(
        new ForbiddenException(
          'Only the task creator, project Lead, or workspace Admin can assign or unassign other users',
        ),
      );

      await expect(
        service.assign('task-1', 'regular-member-id', 'someone-else-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow the creator to assign someone else', async () => {
      taskRepository.findOne.mockResolvedValue({ ...baseTask, assignees: [] });
      permissionsService.assertCanAssignTask.mockResolvedValue(undefined);

      const result = await service.assign('task-1', 'creator-id', 'other-user-id');

      expect(result.assignees.some((a: { id: string }) => a.id === 'other-user-id')).toBe(true);
    });

    it('should allow the Lead to assign someone else', async () => {
      taskRepository.findOne.mockResolvedValue({ ...baseTask, assignees: [] });
      permissionsService.assertCanAssignTask.mockResolvedValue(undefined);

      const result = await service.assign('task-1', 'lead-id', 'other-user-id');

      expect(result.assignees.some((a: { id: string }) => a.id === 'other-user-id')).toBe(true);
    });

    it('should throw ConflictException if the user is already assigned', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'already-assigned-id' }],
      });
      permissionsService.assertCanAssignTask.mockResolvedValue(undefined);

      await expect(service.assign('task-1', 'creator-id', 'already-assigned-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unassign', () => {
    const baseTask = {
      id: 'task-1',
      projectId: 'project-1',
      creatorId: 'creator-id',
    };

    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', leadId: 'lead-id' });
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
    });

    it('should throw ForbiddenException if the creator tries to unassign themselves', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'creator-id' }],
      });

      await expect(service.unassign('task-1', 'creator-id', 'creator-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow a self-assigned (non-creator) user to unassign themselves', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'self-assigned-id' }],
      });

      const result = await service.unassign('task-1', 'self-assigned-id', 'self-assigned-id');

      expect(result.assignees.some((a: { id: string }) => a.id === 'self-assigned-id')).toBe(false);
    });

    it('should allow a user assigned by someone else to unassign themselves', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'assigned-by-lead-id' }],
      });

      const result = await service.unassign('task-1', 'assigned-by-lead-id', 'assigned-by-lead-id');

      expect(result.assignees.some((a: { id: string }) => a.id === 'assigned-by-lead-id')).toBe(
        false,
      );
    });

    it('should throw ForbiddenException if a regular member tries to unassign someone else', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'other-user-id' }],
      });
      permissionsService.assertCanAssignTask.mockRejectedValue(
        new ForbiddenException(
          'Only the task creator, project Lead, or workspace Admin can assign or unassign other users',
        ),
      );

      await expect(
        service.unassign('task-1', 'regular-member-id', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow the creator to unassign someone else', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...baseTask,
        assignees: [{ id: 'other-user-id' }],
      });
      permissionsService.assertCanAssignTask.mockResolvedValue(undefined);

      const result = await service.unassign('task-1', 'creator-id', 'other-user-id');

      expect(result.assignees.some((a: { id: string }) => a.id === 'other-user-id')).toBe(false);
    });
  });
});
