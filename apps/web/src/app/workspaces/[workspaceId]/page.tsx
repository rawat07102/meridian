'use server';
import { DataTable, columns } from '@/components/layout/data-table';
import { ButtonGroup } from '@/components/ui/button-group';
import { Project } from '@/features/projects/projects.types';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import CreateProjectDialog from '@/features/projects/components/create-project-dialog';

type Props = {
  params: Promise<{
    workspaceId: string;
  }>;
};
export default async function WorkspacePage({ params }: Props) {
  const { workspaceId } = await params;
  const projects = await apiFetch<Project[]>(`/workspaces/${workspaceId}/projects`);

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
          <CreateProjectDialog workspaceId={workspaceId} />
        </div>
      </div>
      <section>
        <DataTable columns={columns} data={projects} />
      </section>
    </>
  );
}
