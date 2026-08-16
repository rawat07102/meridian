import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRoleGuard } from './workspace-role.guard';
import { PermissionsService } from '../../permissions/permissions.service';

describe('WorkspaceRoleGuard', () => {
  let guard: WorkspaceRoleGuard;
  let reflector: { get: jest.Mock };
  let permissionsService: { getWorkspaceRoleRank: jest.Mock };

  const buildContext = (params: Record<string, string>, userId = 'user-1'): ExecutionContext => {
    return {
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          params,
          user: { id: userId },
        }),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    reflector = { get: jest.fn() };
    permissionsService = { getWorkspaceRoleRank: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceRoleGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    guard = module.get<WorkspaceRoleGuard>(WorkspaceRoleGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow the request through if no MinWorkspaceRoleRank decorator is set', async () => {
    reflector.get.mockReturnValue(undefined);
    const context = buildContext({ id: 'workspace-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsService.getWorkspaceRoleRank).not.toHaveBeenCalled();
  });

  it('should allow the request through if the user meets the required rank', async () => {
    reflector.get.mockReturnValue(2); // Admin required
    permissionsService.getWorkspaceRoleRank.mockResolvedValue(2); // user is Admin
    const context = buildContext({ id: 'workspace-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw ForbiddenException if the user does not meet the required rank', async () => {
    reflector.get.mockReturnValue(2); // Admin required
    permissionsService.getWorkspaceRoleRank.mockResolvedValue(1); // user is only Member
    const context = buildContext({ id: 'workspace-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should resolve workspaceId from params.workspaceId when present', async () => {
    reflector.get.mockReturnValue(1);
    permissionsService.getWorkspaceRoleRank.mockResolvedValue(1);
    const context = buildContext({ workspaceId: 'workspace-1' });

    await guard.canActivate(context);

    expect(permissionsService.getWorkspaceRoleRank).toHaveBeenCalledWith('user-1', 'workspace-1');
  });

  it('should fall back to params.id when workspaceId is not present', async () => {
    reflector.get.mockReturnValue(1);
    permissionsService.getWorkspaceRoleRank.mockResolvedValue(1);
    const context = buildContext({ id: 'workspace-1' });

    await guard.canActivate(context);

    expect(permissionsService.getWorkspaceRoleRank).toHaveBeenCalledWith('user-1', 'workspace-1');
  });

  it('should throw ForbiddenException if no workspace context is found in params', async () => {
    reflector.get.mockReturnValue(1);
    const context = buildContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
