import { Status, Task } from '@/features/tasks/tasks.types';
import { useDroppable } from '@dnd-kit/react';
import { GripVertical, Plus, Ellipsis } from 'lucide-react';
import { BoardCard } from './board-card';

type BoardColumnProps = {
  id: Status;
  label: string;
  tasks: Task[];
};

export function BoardColumn({ id, label, tasks }: BoardColumnProps) {
  const { ref } = useDroppable({
    id,
  });
  return (
    <div ref={ref} className="bg-secondary flex flex-col rounded-md gap-2 py-2 px-2 min-w-75">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <GripVertical strokeWidth={2} size={14} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="flex gap-2 items-center">
          <Plus strokeWidth={2} size={14} />
          <Ellipsis strokeWidth={2} size={14} />
        </div>
      </div>
      {tasks.map((t) => (
        <BoardCard key={t.id} task={t} />
      ))}
    </div>
  );
}
