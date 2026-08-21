import TaskBoard from '@/components/layout/task-board';
import { groupTasksByStatus } from '@/components/layout/task-board/helpers';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import CreateTaskDialog from '@/features/tasks/components/create-task-dialog';
import { Task } from '@/features/tasks/tasks.types';
import { apiFetch } from '@/lib/api';
import { Search } from 'lucide-react';

export default async function GuestTasks() {
  const guestProjectId =
    process.env.NEXT_PUBLIC_GUEST_PROJECT_ID || '673c9d61-a544-4a14-a56a-533e313486db';
  const tasks = await apiFetch<Task[]>(`/projects/${guestProjectId}/tasks`, {
    next: {
      tags: ['guest-tasks'],
    },
  });
  const groupedTasks = groupTasksByStatus(tasks);

  return (
    <>
      <div className="flex justify-between w-full">
        <h1>Projects</h1>
        <div className="flex gap-2">
          <ButtonGroup>
            <Button variant="outline">
              <Search size={16} />
            </Button>
            <Input />
          </ButtonGroup>
          <CreateTaskDialog projectId={guestProjectId} />
        </div>
      </div>
      <section className="overflow-x-scroll">
        <TaskBoard initialTasks={groupedTasks} />
      </section>
    </>
  );
}
