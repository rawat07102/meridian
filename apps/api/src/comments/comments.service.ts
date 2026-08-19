import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(taskId: Task['id'], authorId: User['id'], dto: CreateCommentDto): Promise<Comment> {
    const task = await this.fetchTaskOrFail(taskId);
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertProjectMember(authorId, project);

    return this.commentRepository.save(
      this.commentRepository.create({ taskId, authorId, content: dto.content }),
    );
  }

  async findAllForTask(taskId: Task['id'], user: User): Promise<Comment[]> {
    const task = await this.fetchTaskOrFail(taskId);
    const project = await this.fetchProjectOrFail(task.projectId);
    await this.permissionsService.assertProjectMember(user.id, project);

    return this.commentRepository.find({ where: { taskId }, order: { createdAt: 'ASC' } });
  }

  async update(id: string, userId: User['id'], dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.fetchCommentOrFail(id);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the comment author can edit this comment');
    }

    Object.assign(comment, dto);
    return this.commentRepository.save(comment);
  }

  async remove(id: string, userId: User['id']): Promise<void> {
    const comment = await this.fetchCommentOrFail(id);
    const task = await this.fetchTaskOrFail(comment.taskId);
    const project = await this.fetchProjectOrFail(task.projectId);

    await this.permissionsService.assertCanDeleteComment(userId, project, comment);
    await this.commentRepository.remove(comment);
  }

  private async fetchCommentOrFail(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
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
}
