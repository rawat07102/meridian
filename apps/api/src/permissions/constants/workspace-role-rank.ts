import { WorkspaceRole } from '../../workspaces/entities/workspace-member.entity';

export const WORKSPACE_ROLE_RANK: Readonly<Record<WorkspaceRole, number>> = Object.freeze({
  [WorkspaceRole.ADMIN]: 2,
  [WorkspaceRole.MEMBER]: 1,
});
