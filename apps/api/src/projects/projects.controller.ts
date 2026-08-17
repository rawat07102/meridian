import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { User } from '../users/entities/user.entity';
import { WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { MinWorkspaceRoleRank } from '../common/decorators/min-workspace-role-rank.decorator';
import { ProjectRole } from '../permissions/constants/project-role-rank';
import { MinProjectRoleRank } from './decorators/min-project-role-rank.decorator';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRoleGuard } from './guards/project-role.guard';
import { ChangeLeadDto } from './dto/change-lead.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Post('/workspaces/:workspaceId/projects')
  create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspaceId, user.id, dto);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.MEMBER)
  @Get('/workspaces/:workspaceId/projects')
  findAllForWorkspace(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.projectsService.findAllForWorkspace(workspaceId);
  }

  @Get('projects/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user.id);
  }

  @UseGuards(ProjectRoleGuard)
  @MinProjectRoleRank(ProjectRole.LEAD)
  @Patch('projects/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @MinProjectRoleRank(ProjectRole.LEAD)
  @Patch('projects/:id/lead')
  changeLead(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeLeadDto) {
    return this.projectsService.changeLead(id, dto.newLeadId);
  }

  @Delete('projects/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user.id);
  }
}
