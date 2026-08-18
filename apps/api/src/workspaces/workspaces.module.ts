import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { InviteLink } from './entities/invite-link.entity';
import { WorkspaceInviteEmail } from './entities/workspace-invite-email.entity';
import { InviteLinksService } from './invite-links.service';
import { InviteLinksPublicController } from './invite-links-public.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, InviteLink, WorkspaceInviteEmail]),
    PermissionsModule,
    AuthModule,
  ],
  providers: [WorkspacesService, WorkspaceRoleGuard, InviteLinksService],
  controllers: [WorkspacesController, InviteLinksPublicController],
  exports: [],
})
export class WorkspacesModule {}
