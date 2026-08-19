import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { Label } from '../labels/entities/label.entity';
import { GuestJwtPayload } from 'src/auth/interfaces/guest-jwt-payload.interface';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(projectId: Project['id'], creatorId: User['id'], dto: CreateTaskDto): Promise<Task> {
    const project = await this.fetchProjectOrFail(projectId);
    await this.permissionsService.assertProjectMember(creatorId, project);

    const position = await this.getNextPosition(projectId, TaskStatus.BACKLOG);

    const task = this.taskRepository.create({
      ...dto,
      projectId,
      creatorId,
      status: TaskStatus.BACKLOG,
      position,
    });

    return this.taskRepository.save(task);
  }

  async findAllForProject(projectId: Project['id'], user: User | GuestJwtPayload): Promise<Task[]> {
    const project = await this.fetchProjectOrFail(projectId);
    await this.permissionsService.assertCanViewProjectAsUserOrGuest(user, project);

    return this.taskRepository.find({ where: { projectId }, order: { position: 'ASC' } });
  }

  async findOne(id: string, user: User | GuestJwtPayload): Promise<Task> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertCanViewProjectAsUserOrGuest(user, project);
    return task;
  }

  async update(id: string, userId: User['id'], dto: UpdateTaskDto): Promise<Task> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertProjectMember(userId, project);

    this.taskRepository.merge(task, dto);
    return this.taskRepository.save(task);
  }

  async updateStatus(id: string, userId: User['id'], dto: UpdateStatusDto): Promise<Task> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertProjectMember(userId, project);

    task.status = dto.status;
    task.position = await this.getNextPosition(task.projectId, dto.status);

    return this.taskRepository.save(task);
  }

  async remove(id: string, userId: User['id']): Promise<void> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertCanDeleteTask(userId, project);

    await this.taskRepository.remove(task);
  }

  async reorder(id: string, userId: User['id'], dto: ReorderTaskDto): Promise<Task> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertProjectMember(userId, project);

    const newPosition = await this.calculatePosition(dto.prevTaskId, dto.nextTaskId);

    task.status = dto.newStatus;
    task.position = newPosition;

    return this.taskRepository.save(task);
  }

  async assign(taskId: string, actingUserId: User['id'], targetUserId: User['id']): Promise<Task> {
    const task = await this.fetchTaskOrFail(taskId, { assignees: true });
    const project = await this.fetchProjectOrFail(task.projectId);

    const isSelfAssign = actingUserId === targetUserId;
    if (!isSelfAssign) {
      await this.permissionsService.assertCanAssignTask(actingUserId, task, project);
    } else {
      await this.permissionsService.assertProjectMember(actingUserId, project);
    }

    const alreadyAssigned = task.assignees.some((a) => a.id === targetUserId);
    if (alreadyAssigned) throw new ConflictException('User is already assigned to this task');

    task.assignees.push({ id: targetUserId } as User);
    return this.taskRepository.save(task);
  }

  async unassign(
    taskId: string,
    actingUserId: User['id'],
    targetUserId: User['id'],
  ): Promise<Task> {
    const task = await this.fetchTaskOrFail(taskId, {
      assignees: true,
    });
    const project = await this.fetchProjectOrFail(task.projectId);

    const isSelfUnassign = actingUserId === targetUserId;

    if (isSelfUnassign) {
      if (task.creatorId === actingUserId) {
        throw new ForbiddenException('The creator cannot unassign themselves from their own task');
      }
    } else {
      await this.permissionsService.assertCanAssignTask(actingUserId, task, project);
    }

    task.assignees = task.assignees.filter((a) => a.id !== targetUserId);
    return this.taskRepository.save(task);
  }

  async attachLabel(taskId: string, userId: User['id'], labelId: string): Promise<Task> {
    const task = await this.fetchTaskOrFail(taskId, { labels: true });
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertProjectMember(userId, project);

    const alreadyAttached = task.labels.some((l) => l.id === labelId);
    if (!alreadyAttached) {
      task.labels.push({ id: labelId } as Label);
      await this.taskRepository.save(task);
    }
    return task;
  }

  async detachLabel(taskId: string, userId: User['id'], labelId: string): Promise<Task> {
    const task = await this.fetchTaskOrFail(taskId, { labels: true });
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertProjectMember(userId, project);

    task.labels = task.labels.filter((l) => l.id !== labelId);
    return this.taskRepository.save(task);
  }

  async addSubtask(parentTaskId: string, subtaskId: string, user: User): Promise<Task> {
    if (parentTaskId === subtaskId) {
      throw new ConflictException('A task cannot be its own subtask');
    }

    const parentTask = await this.fetchTaskOrFail(parentTaskId);
    const subtask = await this.fetchTaskOrFail(subtaskId);
    const project = await this.fetchProjectOrFail(parentTask.projectId);

    await this.permissionsService.assertProjectMember(user.id, project);

    await this.assertNoCycle(parentTaskId, subtaskId);

    subtask.parentTaskId = parentTaskId;
    return this.taskRepository.save(subtask);
  }

  async removeSubtask(parentTaskId: string, subtaskId: string, user: User): Promise<Task> {
    const subtask = await this.fetchTaskOrFail(subtaskId);
    const parentTask = await this.fetchTaskOrFail(parentTaskId);
    const project = await this.fetchProjectOrFail(parentTask.projectId);

    await this.permissionsService.assertProjectMember(user.id, project);

    if (subtask.parentTaskId !== parentTaskId) {
      throw new ConflictException('This task is not a subtask of the given parent');
    }

    subtask.parentTaskId = null;
    return this.taskRepository.save(subtask);
  }

  private async assertNoCycle(parentTaskId: string, subtaskId: string): Promise<void> {
    // Walk up from parentTaskId's ancestors — if subtaskId appears, linking would create a cycle
    let currentId: string | null = parentTaskId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === subtaskId) {
        throw new ConflictException('This would create a circular subtask reference');
      }
      if (visited.has(currentId)) break; // safety net against pre-existing bad data
      visited.add(currentId);

      // oxlint-disable-next-line no-await-in-loop
      const current = await this.taskRepository.findOne({ where: { id: currentId } });
      currentId = current?.parentTaskId ?? null;
    }
  }

  private async calculatePosition(
    prevTaskId: string | undefined,
    nextTaskId: string | undefined,
  ): Promise<number> {
    const prevTask = prevTaskId
      ? await this.taskRepository.findOne({ where: { id: prevTaskId } })
      : null;
    const nextTask = nextTaskId
      ? await this.taskRepository.findOne({ where: { id: nextTaskId } })
      : null;

    if (!prevTask && !nextTask) return 1000; // empty column
    if (!prevTask) return nextTask!.position - 1000; // moved to top
    if (!nextTask) return prevTask.position + 1000; // moved to bottom
    return (prevTask.position + nextTask.position) / 2; // moved between two
  }

  private async fetchTaskOrFail(
    id: string,
    relations: FindOptionsRelations<Task> = {},
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id }, relations });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
  private async fetchProjectOrFail(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async getNextPosition(projectId: Project['id'], status: TaskStatus): Promise<number> {
    const lastTask = await this.taskRepository.findOne({
      where: { projectId, status },
      order: { position: 'DESC' },
    });
    return lastTask ? lastTask.position + 1000 : 1000;
  }
}
