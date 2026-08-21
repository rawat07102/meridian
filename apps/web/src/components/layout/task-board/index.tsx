'use client';

import { mockTasks } from './taskData.mock';
import { DragDropProvider } from '@dnd-kit/react';
import React from 'react';
import { BoardColumn } from './board-column';
import { GroupedTasks, groupTasksByStatus, isStatusGuard } from './helpers';

const groupedTasks = groupTasksByStatus(mockTasks);

export default function TaskBoard() {
  const [tasks, setTasks] = React.useState<GroupedTasks>(groupedTasks);
  return (
    <div className="flex gap-4 rounded-2xl p-2">
      <DragDropProvider
        onDragEnd={({ canceled, operation }) => {
          if (canceled) return;
          const taskId = operation.source?.id;
          const newStatus = operation.target?.id as string;
          const activeStatus = operation.source?.data.status;
          console.log(`Task ${taskId} moved to ${newStatus} from ${activeStatus}`);
          if (!isStatusGuard(newStatus) || !isStatusGuard(activeStatus)) {
            console.error(`invalid status ${newStatus} or ${activeStatus}}`);
            return;
          }

          if (newStatus === activeStatus) {
            console.error(`same status ${newStatus} or ${activeStatus}`);
            return;
          }

          const task = tasks[activeStatus].find((t) => t.id === taskId);
          if (!task) {
            console.error(`task ${taskId} not found`);
            return;
          }
          task.status = newStatus;

          const newTasks = {
            ...tasks,
            [newStatus]: [...tasks[newStatus], task],
            [activeStatus]: tasks[activeStatus].filter((t) => t.id !== taskId),
          };

          setTasks(newTasks);
        }}
      >
        <BoardColumn id="todo" label="To Do" tasks={tasks.todo} />
        <BoardColumn id="in_progress" label="In Progress" tasks={tasks.in_progress} />
        <BoardColumn id="done" label="Done" tasks={tasks.done} />
        <BoardColumn id="in_review" label="In Review" tasks={tasks.in_review} />
        <BoardColumn id="backlog" label="Backlog" tasks={tasks.backlog} />
      </DragDropProvider>
    </div>
  );
}
