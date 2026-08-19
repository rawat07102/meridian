'use client';

import projectsApi from '@/features/projects/projects.api';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function WorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspaces', id, 'projects'],
    queryFn: () => projectsApi.findAllForWorkspace(id),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <main>
      <ul>
        {projects?.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </main>
  );
}
