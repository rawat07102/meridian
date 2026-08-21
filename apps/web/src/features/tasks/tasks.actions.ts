'use server';

import { apiFetch } from '@/lib/api';
import { CreateTaskData } from './tasks.types';
import { updateTag } from 'next/cache';

export async function createTask(projectId: string, data: CreateTaskData) {
  const task = await apiFetch(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  updateTag('guest-tasks');
  return task;
}
