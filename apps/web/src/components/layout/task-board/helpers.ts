import { Status, Task } from '@/features/tasks/tasks.types';

export const ALL_STATUSES: Status[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export type GroupedTasks = Record<Status, Task[]>;

export function groupTasksByStatus(tasks: Task[]): GroupedTasks {
  const initialGroup = ALL_STATUSES.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as GroupedTasks);

  return tasks.reduce((acc, task) => {
    acc[task.status].push(task);
    return acc;
  }, initialGroup);
}
export function isStatusGuard(value: unknown): value is Status {
  return typeof value === 'string' && ALL_STATUSES.includes(value as Status);
}
