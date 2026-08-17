import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { PermissionsService } from './permissions.service';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMember, Project, ProjectMember])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
