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

  async findAllForProject(projectId: Project['id'], userId: User['id']): Promise<Task[]> {
    const project = await this.fetchProjectOrFail(projectId);
    await this.permissionsService.assertCanViewProject(userId, project);

    return this.taskRepository.find({ where: { projectId }, order: { position: 'ASC' } });
  }

  async findOne(id: string, userId: User['id']): Promise<Task> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertCanViewProject(userId, project);
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
