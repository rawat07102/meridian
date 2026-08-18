import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MinWorkspaceRoleRank } from '../workspaces/decorators/min-workspace-role-rank.decorator';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { User } from '../users/entities/user.entity';

@UseGuards(AuthGuard('jwt'), WorkspaceRoleGuard)
@Controller('workspaces/:workspaceId/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Post()
  create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelsService.create(workspaceId, user.id, dto);
  }

  @MinWorkspaceRoleRank(WorkspaceRole.MEMBER)
  @Get()
  findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.labelsService.findAllForWorkspace(workspaceId);
  }

  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Patch(':labelId')
  update(@Param('labelId', ParseUUIDPipe) labelId: string, @Body() dto: UpdateLabelDto) {
    return this.labelsService.update(labelId, dto);
  }

  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Delete(':labelId')
  remove(@Param('labelId', ParseUUIDPipe) labelId: string) {
    return this.labelsService.remove(labelId);
  }
}
