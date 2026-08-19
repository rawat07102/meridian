import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from 'src/users/entities/user.entity';
import { GuestJwtPayload } from 'src/auth/interfaces/guest-jwt-payload.interface';

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
    assertCanViewProjectAsUserOrGuest: jest.Mock;
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
      assertCanViewProjectAsUserOrGuest: jest.fn(),
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

  describe('findOne', () => {
    it('should throw NotFoundException if the task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', { id: 'user-1' } as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if the task exists but its project does not', async () => {
      taskRepository.findOne.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('task-1', { id: 'user-1' } as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if a regular user cannot view the project', async () => {
      taskRepository.findOne.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertCanViewProjectAsUserOrGuest.mockRejectedValue(
        new ForbiddenException('You are not a member of this workspace'),
      );

      await expect(service.findOne('task-1', { id: 'non-member-id' } as User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return the task for a regular user who can view the project', async () => {
      const task = { id: 'task-1', projectId: 'project-1' };
      taskRepository.findOne.mockResolvedValue(task);
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);

      const result = await service.findOne('task-1', { id: 'member-id' } as User);

      expect(result).toEqual(task);
    });

    it("should return the task for a guest scoped to the project's workspace", async () => {
      const task = { id: 'task-1', projectId: 'project-1' };
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      taskRepository.findOne.mockResolvedValue(task);
      projectRepository.findOne.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);

      const guestPayload = { role: 'guest', workspaceId: 'workspace-1' };
      const result = await service.findOne('task-1', guestPayload as GuestJwtPayload);

      expect(result).toEqual(task);
      expect(permissionsService.assertCanViewProjectAsUserOrGuest).toHaveBeenCalledWith(
        guestPayload,
        project,
      );
    });

    it('should throw ForbiddenException for a guest scoped to a different workspace', async () => {
      taskRepository.findOne.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertCanViewProjectAsUserOrGuest.mockRejectedValue(
        new ForbiddenException('This guest link does not grant access to this workspace'),
      );

      const guestPayload = { role: 'guest', workspaceId: 'different-workspace-id' };

      await expect(service.findOne('task-1', guestPayload as GuestJwtPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAllForProject', () => {
    it('should throw NotFoundException if the project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findAllForProject('nonexistent-id', { id: 'user-1' } as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if a regular user cannot view the project', async () => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertCanViewProjectAsUserOrGuest.mockRejectedValue(
        new ForbiddenException('You are not a member of this workspace'),
      );

      await expect(
        service.findAllForProject('project-1', { id: 'non-member-id' } as User),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return tasks ordered by position for a regular user', async () => {
      const tasks = [
        { id: 'task-1', position: 1000 },
        { id: 'task-2', position: 2000 },
      ];
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAllForProject('project-1', { id: 'member-id' } as User);

      expect(taskRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-1' },
          order: { position: 'ASC' },
        }),
      );
      expect(result).toEqual(tasks);
    });

    it("should return tasks for a guest scoped to the project's workspace", async () => {
      const tasks = [{ id: 'task-1', position: 1000 }];
      const project = { id: 'project-1', workspaceId: 'workspace-1' };
      projectRepository.findOne.mockResolvedValue(project);
      permissionsService.assertCanViewProjectAsUserOrGuest.mockResolvedValue(undefined);
      taskRepository.find.mockResolvedValue(tasks);

      const guestPayload = { role: 'guest', workspaceId: 'workspace-1' };
      const result = await service.findAllForProject('project-1', guestPayload as GuestJwtPayload);

      expect(result).toEqual(tasks);
      expect(permissionsService.assertCanViewProjectAsUserOrGuest).toHaveBeenCalledWith(
        guestPayload,
        project,
      );
    });
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

  // Add these describe blocks to the existing tasks.service.spec.ts file.
  describe('addSubtask', () => {
    const user = { id: 'user-1' } as User;

    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
    });

    it('should throw ConflictException if a task is linked to itself', async () => {
      await expect(service.addSubtask('task-1', 'task-1', user)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on a direct cycle (A -> B, then B -> A)', async () => {
      // parentTaskId = 'task-b', subtaskId = 'task-a'
      // task-b's ancestor chain: task-b -> task-a (task-b.parentTaskId = task-a)
      // linking task-a as a subtask of task-b would create a cycle
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-b', parentTaskId: null }) // fetchTaskOrFail(parentTaskId='task-b')
        .mockResolvedValueOnce({ id: 'task-a', parentTaskId: null }) // fetchTaskOrFail(subtaskId='task-a')
        .mockResolvedValueOnce({ id: 'task-b', parentTaskId: 'task-a' }); // assertNoCycle walk: current=task-b

      await expect(service.addSubtask('task-b', 'task-a', user)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on an indirect/multi-level cycle', async () => {
      // Chain: task-c -> task-b -> task-a
      // Trying to link task-a as a subtask of task-c would create a cycle,
      // since task-a is already an ancestor of task-c (via task-b)
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-c', parentTaskId: null }) // fetchTaskOrFail(parentTaskId='task-c')
        .mockResolvedValueOnce({ id: 'task-a', parentTaskId: null }) // fetchTaskOrFail(subtaskId='task-a')
        .mockResolvedValueOnce({ id: 'task-c', parentTaskId: 'task-b' }) // walk: current=task-c
        .mockResolvedValueOnce({ id: 'task-b', parentTaskId: 'task-a' }); // walk: current=task-b

      await expect(service.addSubtask('task-c', 'task-a', user)).rejects.toThrow(ConflictException);
    });

    it('should successfully link a subtask when there is no cycle', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-1', parentTaskId: null }) // fetchTaskOrFail(parentTaskId)
        .mockResolvedValueOnce({ id: 'task-2', parentTaskId: null }) // fetchTaskOrFail(subtaskId)
        .mockResolvedValueOnce({ id: 'task-1', parentTaskId: null }); // assertNoCycle walk: current=task-1, no parent

      const result = await service.addSubtask('task-1', 'task-2', user);

      expect(result.parentTaskId).toBe('task-1');
    });

    it('should throw ForbiddenException if the user is not a project member', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-1', parentTaskId: null })
        .mockResolvedValueOnce({ id: 'task-2', parentTaskId: null });
      permissionsService.assertProjectMember.mockRejectedValue(
        new ForbiddenException('You are not a member of this project'),
      );

      await expect(service.addSubtask('task-1', 'task-2', user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeSubtask', () => {
    const user = { id: 'user-1' } as User;

    beforeEach(() => {
      projectRepository.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
      permissionsService.assertProjectMember.mockResolvedValue(undefined);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
    });

    it('should throw ConflictException if the task is not actually a subtask of the given parent', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-2', parentTaskId: 'some-other-parent' }) // subtask
        .mockResolvedValueOnce({ id: 'task-1', parentTaskId: null }); // parentTask

      await expect(service.removeSubtask('task-1', 'task-2', user)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should unlink the subtask when it is actually a subtask of the given parent', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce({ id: 'task-2', parentTaskId: 'task-1' }) // subtask
        .mockResolvedValueOnce({ id: 'task-1', parentTaskId: null }); // parentTask

      const result = await service.removeSubtask('task-1', 'task-2', user);

      expect(result.parentTaskId).toBeNull();
    });
  });
});
