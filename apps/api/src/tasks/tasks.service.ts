import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
  async remove(id: string, userId: User['id']): Promise<void> {
    const task = await this.fetchTaskOrFail(id);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertCanDeleteTask(userId, project);

    await this.taskRepository.remove(task);
  }

  private async fetchTaskOrFail(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
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
