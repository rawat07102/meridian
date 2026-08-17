import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WORKSPACE_ROLE_RANK } from './constants/workspace-role-rank';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { PROJECT_ROLE_RANK, ProjectRole } from './constants/project-role-rank';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async getWorkspaceRoleRank(userId: User['id'], workspaceId: Workspace['id']): Promise<number> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId },
    });
    if (!member) return 0; // not a member at all
    return WORKSPACE_ROLE_RANK[member.role];
  }

  async isWorkspaceAdmin(userId: User['id'], workspaceId: Workspace['id']): Promise<boolean> {
    const rank = await this.getWorkspaceRoleRank(userId, workspaceId);
    return rank >= WORKSPACE_ROLE_RANK[WorkspaceRole.ADMIN];
  }

  async assertWorkspaceAdmin(userId: User['id'], workspaceId: Workspace['id']): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, workspaceId);
    if (!isAdmin) throw new ForbiddenException('Only workspace admins can perform this action');
  }

  async assertWorkspaceMember(userId: User['id'], workspaceId: Workspace['id']): Promise<void> {
    const rank = await this.getWorkspaceRoleRank(userId, workspaceId);
    if (rank < WORKSPACE_ROLE_RANK[WorkspaceRole.MEMBER])
      throw new ForbiddenException('You are not a member of this workspace');
  }

  async getProjectRoleRank(userId: User['id'], projectId: Project['id']): Promise<number> {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Project not found');

    const member = await this.projectMemberRepository.findOneBy({
      userId,
      projectId,
    });

    if (!member) return 0; // not a member at all
    return project.leadId === userId
      ? PROJECT_ROLE_RANK[ProjectRole.LEAD]
      : PROJECT_ROLE_RANK[ProjectRole.MEMBER];
  }

  async getEffectiveProjectRole(userId: User['id'], projectId: Project['id']): Promise<number> {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Project not found');

    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);
    if (isAdmin) return PROJECT_ROLE_RANK[ProjectRole.LEAD];
    return await this.getProjectRoleRank(userId, projectId);
  }

  async assertCanViewProject(userId: User['id'], project: Project): Promise<void> {
    await this.assertWorkspaceMember(userId, project.workspaceId);
  }
}
