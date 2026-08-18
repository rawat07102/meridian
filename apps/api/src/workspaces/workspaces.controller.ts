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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { MinWorkspaceRoleRank } from '../workspaces/decorators/min-workspace-role-rank.decorator';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspaceRole } from './entities/workspace-member.entity';
import { InviteLinksService } from './invite-link-service.service';
import { UpdateInviteLinkExpiryDto } from './dto/update-invite-link-expiry.dto';
import { AddInviteEmailDto } from './dto/add-invite-email.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly inviteLinksService: InviteLinksService,
  ) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAllForUser(user.id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.MEMBER)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.findOne(id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.workspacesService.remove(id, user.id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Post(':id/transfer-ownership')
  transferOwnership(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.workspacesService.transferOwnership(id, user.id, dto.newOwnerId);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.MEMBER)
  @Post(':id/leave')
  leave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.workspacesService.leave(id, user.id);
  }

  // Invite Link Routes
  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Post(':workspaceId/invite-link')
  createOrRegenerateInviteLink(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() user: User,
  ) {
    return this.inviteLinksService.createOrRegenerate(workspaceId, user.id);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Get(':workspaceId/invite-link')
  getInviteLink(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.inviteLinksService.findCurrent(workspaceId);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Patch(':workspaceId/invite-link')
  updateInviteLinkExpiry(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: UpdateInviteLinkExpiryDto,
  ) {
    return this.inviteLinksService.updateExpiry(workspaceId, new Date(dto.expiresAt));
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Delete(':workspaceId/invite-link')
  revokeInviteLink(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.inviteLinksService.revoke(workspaceId);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Post(':workspaceId/invite-emails')
  addInviteEmail(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: AddInviteEmailDto,
  ) {
    return this.inviteLinksService.addEmail(workspaceId, dto.email);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Get(':workspaceId/invite-emails')
  getInviteEmails(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.inviteLinksService.findEmails(workspaceId);
  }

  @UseGuards(WorkspaceRoleGuard)
  @MinWorkspaceRoleRank(WorkspaceRole.ADMIN)
  @Delete(':workspaceId/invite-emails/:emailId')
  removeInviteEmail(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('emailId', ParseUUIDPipe) emailId: string,
  ) {
    return this.inviteLinksService.removeEmail(workspaceId, emailId);
  }
}
