import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { MIN_WORKSPACE_ROLE_RANK_KEY } from '../decorators/min-workspace-role-rank.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRank = this.reflector.get<number>(
      MIN_WORKSPACE_ROLE_RANK_KEY,
      context.getHandler(),
    );

    if (requiredRank === undefined) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const workspaceId: string | undefined = request.params.workspaceId ?? request.params.id;

    if (!workspaceId) {
      throw new ForbiddenException('No workspace context found for this route');
    }

    const actualRank = await this.permissionsService.getWorkspaceRoleRank(user.id, workspaceId);

    if (actualRank < requiredRank) {
      throw new ForbiddenException('You do not have sufficient permissions in this workspace');
    }

    return true;
  }
}
