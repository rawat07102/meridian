import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../../workspaces/entities/workspace-member.entity';
import { WORKSPACE_ROLE_RANK } from '../../permissions/constants/workspace-role-rank';

export const MIN_WORKSPACE_ROLE_RANK_KEY = 'minWorkspaceRoleRank';
export const MinWorkspaceRoleRank = (role: WorkspaceRole) =>
  SetMetadata(MIN_WORKSPACE_ROLE_RANK_KEY, WORKSPACE_ROLE_RANK[role]);
