import { SetMetadata } from '@nestjs/common';
import { ProjectRole, PROJECT_ROLE_RANK } from '../../permissions/constants/project-role-rank';

export const MIN_PROJECT_ROLE_RANK_KEY = 'minProjectRoleRank';
export const MinProjectRoleRank = (role: ProjectRole) =>
  SetMetadata(MIN_PROJECT_ROLE_RANK_KEY, PROJECT_ROLE_RANK[role]);
