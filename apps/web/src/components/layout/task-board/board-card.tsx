import { Task } from '@/features/tasks/tasks.types';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Ellipsis, Tag } from 'lucide-react';
import { useDraggable } from '@dnd-kit/react';

type Props = {
  task: Task;
};

export function BoardCard({ task }: Props) {
  const { ref } = useDraggable({
    id: task.id,
    data: {
      status: task.status,
    },
  });
  return (
    <div ref={ref} className="w-full flex flex-col rounded-md border-border bg-card p-3 gap-3">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-sm font-medium">{task.title}</h1>
        <button
          type="button"
          aria-label="More task actions"
          className="mt-2 rounded-md p-1 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Ellipsis size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          </Avatar>
          <span className="text-xs font-medium">Admin</span>
        </div>

        <div className="flex items-center py-0.5 px-2 self-start rounded-full bg-destructive/10 text-destructive">
          <CalendarDays size={10} aria-hidden="true" />
          {task.dueDate && (
            <span className="text-xs font-medium">{format(parseISO(task.dueDate), 'd MMM')}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap">
        {task.labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
          >
            <Tag size={12} strokeWidth={2} aria-hidden="true" />
            {label.name}
          </span>
        ))}
      </div>
    </div>
  );
}
