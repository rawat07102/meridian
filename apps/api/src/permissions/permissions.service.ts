import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WORKSPACE_ROLE_RANK } from './constants/workspace-role-rank';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
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
}
