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
import { createProject } from '@/features/projects/projects.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';
import { ProjectPriority, ProjectStatus } from '../projects.types';
import { format } from 'date-fns';

const priorityOptions = [
  { value: 'no_priority', label: 'No Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

type Props = {
  workspaceId: string;
};

export default function CreateProjectDialog({ workspaceId }: Props) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<ProjectPriority>(ProjectPriority.NO_PRIORITY);
  const [dueDate, setDueDate] = React.useState<Date>(new Date());

  const handleSubmit = async () => {
    const data = {
      title,
      description,
      priority,
      startDate: format(Date.now(), 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: ProjectStatus.ACTIVE,
    };
    try {
      await createProject(workspaceId, data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <form>
        <DialogTrigger render={<Button>Add Project</Button>} />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            name="title"
            placeholder="Project Title"
            className="mb-2"
          />
          <Textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            name="description"
            placeholder="Project Description"
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
              onValueChange={(p) => setPriority(p ?? ProjectPriority.NO_PRIORITY)}
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
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleSubmit} type="button">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
