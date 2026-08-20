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
import { MoreHorizontal, Trash } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

type TableData = {
  title: string;
  dueDate: string;
  priority: string;
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
