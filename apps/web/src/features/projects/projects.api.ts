import api from '@/lib/api';
import { Project } from './projects.types';

const projectsApi = {
  async findAllForWorkspace(workspaceId: string): Promise<Project[]> {
    const res = await api.get(`/workspaces/${workspaceId}/projects`);
    return res.data;
  },
};

// const projectsApi = {
//   async findAllForWorkspace(workspaceId: string): Promise<Project[]> {
//     return [
//       {
//         id: 'mock-project-id',
//         title: 'Mock Project',
//         description: 'Mock project description',
//         priority: 'high',
//         status: 'todo',
//         leadId: 'mock-lead-id',
//         createdBy: 'mock-user-id',
//         workspaceId,
//         startDate: null,
//         dueDate: null,
//         color: null,
//         createdAt: '2023-01-01T00:00:00.000Z',
//         updatedAt: '2023-01-01T00:00:00.000Z',
//       },
//       {
//         id: 'mock-project-id',
//         title: 'Mock Project',
//         description: 'Mock project description',
//         priority: 'high',
//         status: 'todo',
//         leadId: 'mock-lead-id',
//         createdBy: 'mock-user-id',
//         workspaceId,
//         startDate: null,
//         dueDate: null,
//         color: null,
//         createdAt: '2023-01-01T00:00:00.000Z',
//         updatedAt: '2023-01-01T00:00:00.000Z',
//       },
//     ];
//   },
// };

export default projectsApi;
