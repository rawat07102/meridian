import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { GuestJwtPayload } from '../../auth/interfaces/guest-jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | GuestJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
