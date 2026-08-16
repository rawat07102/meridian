import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember]), PermissionsModule],
  providers: [WorkspacesService, WorkspaceRoleGuard],
  controllers: [WorkspacesController],
  exports: [],
})
export class WorkspacesModule {}
