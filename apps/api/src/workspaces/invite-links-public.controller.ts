import { Controller, Get, Param, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { InviteLinksService } from './invite-links.service';
import { AuthService } from 'src/auth/auth.service';

@Controller('invite-links')
export class InviteLinksPublicController {
  constructor(
    private readonly inviteLinksService: InviteLinksService,
    private readonly authService: AuthService,
  ) {}

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.inviteLinksService.resolveToken(token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':token/join')
  join(@Param('token') token: string, @CurrentUser() user: User) {
    return this.inviteLinksService.join(token, user);
  }

  @Post(':token/guest')
  async issueGuestToken(@Param('token') token: string) {
    const link = await this.inviteLinksService.validateForGuestAccess(token);
    return this.authService.issueGuestToken(link.workspaceId);
  }
}
