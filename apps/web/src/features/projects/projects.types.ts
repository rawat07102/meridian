export type Project = {
  id: string;
  title: string;
  description: string | null;
  priority: ProjectPriority;
  status: string;
  leadId: string;
  createdBy: string;
  workspaceId: string;
  startDate: string | null;
  dueDate: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};
export enum ProjectPriority {
  NO_PRIORITY = 'no_priority',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const PROJECT_PRIORITY: Readonly<Record<ProjectPriority, string>> = Object.freeze({
  [ProjectPriority.NO_PRIORITY]: 'no_priority',
  [ProjectPriority.LOW]: 'low',
  [ProjectPriority.MEDIUM]: 'medium',
  [ProjectPriority.HIGH]: 'high',
  [ProjectPriority.URGENT]: 'urgent',
});

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export const PROJECT_STATUS: Readonly<Record<ProjectStatus, string>> = Object.freeze({
  [ProjectStatus.ACTIVE]: 'active',
  [ProjectStatus.ON_HOLD]: 'on_hold',
  [ProjectStatus.COMPLETED]: 'completed',
  [ProjectStatus.ARCHIVED]: 'archived',
});

export type CreateProjectData = {
  title: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  leadId: string;
  startDate: string;
  dueDate: string;
};
