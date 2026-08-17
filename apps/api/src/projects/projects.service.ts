import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    workspaceId: Workspace['id'],
    createdBy: User['id'],
    dto: CreateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.save(
      this.projectRepository.create({
        ...dto,
        workspaceId,
        createdBy,
      }),
    );

    await this.addMemberIfNotExists(project.id, dto.leadId);
    return project;
  }

  async findOne(id: string, userId: User['id']): Promise<Project> {
    const project = await this.fetchProjectOrFail(id);
    await this.permissionsService.assertCanViewProject(userId, project);
    return project;
  }
  async findAllForWorkspace(workspaceId: Workspace['id']): Promise<Project[]> {
    return await this.projectRepository.findBy({
      workspaceId,
    });
  }

  async update(id: Project['id'], dto: UpdateProjectDto): Promise<Project> {
    const project = await this.fetchProjectOrFail(id);
    return this.projectRepository.save(this.projectRepository.merge(project, dto));
  }

  async changeLead(id: Project['id'], leadId: User['id']) {
    const project = await this.fetchProjectOrFail(id);
    project.leadId = leadId;
    await this.addMemberIfNotExists(id, leadId);
    return this.projectRepository.save(project);
  }

  async remove(id: Project['id'], userId: User['id']) {
    const project = await this.fetchProjectOrFail(id);
    await this.permissionsService.assertWorkspaceAdmin(userId, project.workspaceId);
    await this.projectRepository.remove(project);
  }

  private async addMemberIfNotExists(projectId: Project['id'], userId: User['id']) {
    const existing = await this.projectMemberRepository.findOneBy({
      projectId,
      userId,
    });

    if (existing) return;

    await this.projectMemberRepository.save(
      this.projectMemberRepository.create({ projectId: projectId, userId }),
    );
  }

  private async fetchProjectOrFail(id: Project['id']): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
