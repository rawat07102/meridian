'use server';

import { apiFetch } from '@/lib/api';
import { CreateProjectData, Project } from './projects.types';
import { revalidatePath } from 'next/cache';

type RequestBody = Omit<CreateProjectData, 'leadId'>;
export async function createProject(workspaceId: string, data: RequestBody): Promise<Project> {
  const leadId = process.env.GUEST_ID || 'cc2aff08-df91-4636-82ca-a79c4dff609e';
  Object.assign(data, { leadId });
  const project = await apiFetch<Project>(`/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath(`/workspaces/${workspaceId}`);
  return project;
}
