export type Project = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
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
