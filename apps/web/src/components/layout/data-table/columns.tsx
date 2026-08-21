'use client';

import { createColumnHelper } from '@tanstack/react-table';

import { type DataTableFeatures } from './data-table-features';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Trash,
} from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { TaskPriority } from '@/features/tasks/tasks.types';
import { cn } from '@/lib/utils';

type TableData = {
  title: string;
  dueDate: string;
  priority: TaskPriority;
};

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, TableData>();

export const columns = columnHelper.columns([
  columnHelper.accessor('title', {
    header: 'Task',
  }),
  columnHelper.display({
    header: 'Members',
    cell: () => {
      return (
        <div>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          </Avatar>
        </div>
      );
    },
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    cell: (ctx) => {
      let color = 'text-primary';
      let Icon = SignalZero;
      switch (ctx.row.original.priority) {
        case TaskPriority.LOW:
          color = 'text-gray-400';
          Icon = SignalLow;
          break;
        case TaskPriority.MEDIUM:
          color = 'text-yellow-500';
          Icon = SignalMedium;
          break;
        case TaskPriority.HIGH:
          color = 'text-orange-500';
          Icon = SignalHigh;
          break;
        case TaskPriority.URGENT:
          color = 'text-red-500';
          Icon = Signal;
          break;
      }
      return (
        <span className={cn('capitalize flex gap-1 items-center text-sm', color)}>
          <Icon size={16} />
          {ctx.row.original.priority}
        </span>
      );
    },
  }),
  columnHelper.accessor('dueDate', {
    header: 'Due Date',
  }),
  columnHelper.display({
    id: 'actions',
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Trash />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
