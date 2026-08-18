import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PermissionsService } from '../permissions/permissions.service';
import { Label } from '../labels/entities/label.entity';
import { GuestJwtPayload } from 'src/auth/interfaces/guest-jwt-payload.interface';

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

  async findOne(id: string, user: User | GuestJwtPayload): Promise<Project> {
    const project = await this.fetchProjectOrFail(id);
    await this.permissionsService.assertCanViewProjectAsUserOrGuest(user, project);
    return project;
  }

  async findAllForWorkspace(workspaceId: Workspace['id']): Promise<Project[]> {
    return await this.projectRepository.findBy({
      workspaceId,
    });
  }

  async findAllMembers(projectId: Project['id']): Promise<ProjectMember[]> {
    await this.fetchProjectOrFail(projectId);
    return this.projectMemberRepository.findBy({ projectId });
  }

  async addMember(projectId: Project['id'], userId: User['id']): Promise<ProjectMember> {
    const project = await this.fetchProjectOrFail(projectId);
    const existing = await this.projectMemberRepository.findOneBy({
      projectId,
      userId,
    });
    if (existing) throw new ConflictException('User is already a project member');
    await this.permissionsService.assertWorkspaceMember(userId, project.workspaceId);
    return this.projectMemberRepository.save(
      this.projectMemberRepository.create({ projectId, userId }),
    );
  }

  async removeMember(projectId: Project['id'], userId: User['id']) {
    const project = await this.fetchProjectOrFail(projectId);
    const member = await this.projectMemberRepository.findOneBy({
      projectId,
      userId,
    });
    if (!member) throw new NotFoundException('User is not a project member');
    if (project.leadId === userId)
      throw new ForbiddenException('Cannot remove project leader; reassign the lead first');
    await this.projectMemberRepository.remove(member);
  }

  async leave(projectId: Project['id'], userId: User['id']) {
    const project = await this.fetchProjectOrFail(projectId);
    const member = await this.projectMemberRepository.findOneBy({
      projectId,
      userId,
    });
    if (!member) throw new NotFoundException('User is not a project member');
    if (project.leadId === userId)
      throw new ForbiddenException('Project leader must reassign leadership before leaving');
    await this.projectMemberRepository.remove(member);
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

  async attachLabel(
    projectId: Project['id'],
    userId: User['id'],
    labelId: string,
  ): Promise<Project> {
    const project = await this.fetchProjectOrFail(projectId);
    await this.permissionsService.assertCanEditProject(userId, project);
    const alreadyAttached = project.labels.find((l) => l.id === labelId);
    if (!alreadyAttached) {
      project.labels.push({ id: labelId } as Label);
      await this.projectRepository.save(project);
    }
    return project;
  }

  async detachLabel(
    projectId: Project['id'],
    userId: User['id'],
    labelId: string,
  ): Promise<Project> {
    const project = await this.fetchProjectOrFail(projectId);
    await this.permissionsService.assertCanEditProject(userId, project);
    project.labels = project.labels.filter((l) => l.id !== labelId);
    return this.projectRepository.save(project);
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
