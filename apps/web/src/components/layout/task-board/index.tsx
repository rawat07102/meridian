import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Ellipsis, GripVertical, Plus, Tag } from 'lucide-react';

export default function TaskBoard() {
  return (
    <div className="flex gap-4 rounded-2xl p-2">
      <BoardColumn />
    </div>
  );
}

function BoardColumn() {
  return (
    <div className="bg-secondary flex flex-col rounded-md gap-2 py-2 px-2 min-w-75">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <GripVertical strokeWidth={2} size={14} />
          <span className="text-xs font-medium">To Do</span>
        </div>
        <div className="flex gap-2 items-center">
          <Plus strokeWidth={2} size={14} />
          <Ellipsis strokeWidth={2} size={14} />
        </div>
      </div>
      <BoardCard />
      <BoardCard />
    </div>
  );
}

function BoardCard() {
  return (
    <div className="w-full flex flex-col rounded-md border-border bg-card p-3 gap-3">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-sm font-medium">Write API Documentation</h1>
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
          <span className="text-xs font-medium">29 Jul</span>
        </div>
      </div>

      <div className="flex flex-wrap">
        {['Deployment', 'Deployment'].map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
          >
            <Tag size={12} strokeWidth={2} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
