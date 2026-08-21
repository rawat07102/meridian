'use client';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';
import { format } from 'date-fns';
import { CreateTaskData, Task } from '../tasks.types';
import { createTask } from '../tasks.actions';

const priorityOptions = [
  { value: 'no_priority', label: 'No Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

type Props = {
  projectId: string;
};

export default function CreateTaskDialog({ projectId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('no_priority');
  const [dueDate, setDueDate] = React.useState<Date>(new Date());

  const handleSubmit = async () => {
    const data: CreateTaskData = {
      title,
      description,
      priority,
      startDate: format(Date.now(), 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
    };
    startTransition(async () => {
      await createTask(projectId, data);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger render={<Button>Add Task</Button>} />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            name="title"
            placeholder="Task Title"
            className="mb-2"
          />
          <Textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            name="description"
            placeholder="Task Description"
            className="mb-2"
          />
          <div>
            <DatePicker
              required
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              defaultMonth={dueDate}
            />
            <Select
              value={priority}
              onValueChange={(p) => setPriority(p ?? 'no_priority')}
              required
              items={priorityOptions}
            >
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  {priorityOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button disabled={isPending} variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button disabled={isPending} onClick={handleSubmit} type="button">
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
