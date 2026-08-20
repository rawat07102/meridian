import { Project } from '@/features/projects/projects.types';
import { apiFetch } from '@/lib/api';

type Props = {
  params: Promise<{
    workspaceId: string;
  }>;
};
export default async function WorkspacePage({ params }: Props) {
  const { workspaceId } = await params;
  const projects = await apiFetch<Project[]>(`/workspaces/${workspaceId}/projects`);

  return (
    <main>
      {projects.map((p) => (
        <div key={p.id}>{JSON.stringify(p, null, 2)}</div>
      ))}
    </main>
  );
}
