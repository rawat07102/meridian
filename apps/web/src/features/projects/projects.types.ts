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
