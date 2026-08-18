import { Controller, Get, Param, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { InviteLinksService } from './invite-link-service.service';

@Controller('invite-links')
export class InviteLinksPublicController {
  constructor(private readonly inviteLinksService: InviteLinksService) {}

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.inviteLinksService.resolveToken(token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':token/join')
  join(@Param('token') token: string, @CurrentUser() user: User) {
    return this.inviteLinksService.join(token, user);
  }
}
