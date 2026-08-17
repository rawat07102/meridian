export enum ProjectRole {
  LEAD = 'lead',
  MEMBER = 'member',
}

export const PROJECT_ROLE_RANK: Readonly<Record<ProjectRole, number>> = Object.freeze({
  [ProjectRole.LEAD]: 2,
  [ProjectRole.MEMBER]: 1,
});
