export type Task = {
  id: string;
  creatorId: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  dueDate: string | null;
  parentTaskId: null;
  assignees: Assignee[];
  labels: Label[];
  startDate: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

type Assignee = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

type Label = { id: string; name: string; color: string };

export type Priority = 'no_priority' | 'low' | 'medium' | 'high' | 'urgent';
