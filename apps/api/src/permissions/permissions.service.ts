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
import { Task } from '../tasks/entities/task.entity';
import { GuestJwtPayload } from '../auth/interfaces/guest-jwt-payload.interface';
import { isGuestPayload } from '../auth/utils/is-guest.util';
import { Comment } from 'src/comments/entities/comment.entity';

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

  async assertCanViewWorkspace(
    requester: User | GuestJwtPayload,
    workspaceId: Workspace['id'],
  ): Promise<void> {
    if (isGuestPayload(requester)) {
      if (requester.workspaceId !== workspaceId) {
        throw new ForbiddenException('This guest link does not grant access to this workspace');
      }
      return;
    }
    await this.assertWorkspaceMember(requester.id, workspaceId);
  }

  async assertCanViewProjectAsUserOrGuest(
    requester: User | GuestJwtPayload,
    project: Project,
  ): Promise<void> {
    return this.assertCanViewWorkspace(requester, project.workspaceId);
  }

  async assertProjectMember(userId: User['id'], project: Project): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);
    if (isAdmin) return;

    const rank = await this.getProjectRoleRank(userId, project.id);
    if (rank < PROJECT_ROLE_RANK[ProjectRole.MEMBER]) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }

  async assertCanEditProject(userId: User['id'], project: Project): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);
    if (isAdmin) return;
    const isLead = project.leadId === userId;
    if (isLead) return;
    throw new ForbiddenException('Only the project Lead or a workspace Admin can edit a project');
  }

  async assertCanDeleteTask(userId: User['id'], project: Project): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);
    if (isAdmin) return;

    if (project.leadId !== userId) {
      throw new ForbiddenException('Only the project Lead or a workspace Admin can delete tasks');
    }
  }

  async assertCanDeleteComment(
    userId: User['id'],
    project: Project,
    comment: Comment,
  ): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);

    if (isAdmin) return;
    if (project.leadId === userId) return;
    if (comment.authorId === userId) return;

    throw new ForbiddenException(
      'Only the comment author, project Lead or a workspace Admin can delete comments',
    );
  }

  async assertCanAssignTask(userId: User['id'], task: Task, project: Project): Promise<void> {
    const isAdmin = await this.isWorkspaceAdmin(userId, project.workspaceId);
    if (isAdmin) return;

    const isLead = project.leadId === userId;
    const isCreator = task.creatorId === userId;

    if (!isLead && !isCreator) {
      throw new ForbiddenException(
        'Only the task creator, project Lead, or workspace Admin can assign or unassign other users',
      );
    }
  }
}
