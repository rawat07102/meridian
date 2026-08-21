export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export enum TaskPriority {
  NO_PRIORITY = 'no_priority',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const TASK_PRIORITY: Readonly<Record<TaskPriority, string>> = Object.freeze({
  [TaskPriority.NO_PRIORITY]: 'no_priority',
  [TaskPriority.LOW]: 'low',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.URGENT]: 'urgent',
});
