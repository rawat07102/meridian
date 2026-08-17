import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_PROJECT_ROLE_RANK_KEY } from '../decorators/min-project-role-rank.decorator';
import { User } from '../../users/entities/user.entity';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRank = this.reflector.get<number>(
      MIN_PROJECT_ROLE_RANK_KEY,
      context.getHandler(),
    );
    if (requiredRank === undefined) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const projectId: string | undefined = request.params.projectId ?? request.params.id;

    if (!projectId) {
      throw new ForbiddenException('No project context found for this route');
    }

    const actualRank = await this.permissionsService.getEffectiveProjectRole(user.id, projectId);

    if (actualRank < requiredRank) {
      throw new ForbiddenException('You do not have sufficient permissions in this project');
    }

    return true;
  }
}
