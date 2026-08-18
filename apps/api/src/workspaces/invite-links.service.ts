import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { InviteLink } from './entities/invite-link.entity';
import { WorkspaceInviteEmail } from './entities/workspace-invite-email.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';

const DEFAULT_EXPIRY_DAYS = 30;

@Injectable()
export class InviteLinksService {
  constructor(
    @InjectRepository(InviteLink)
    private readonly inviteLinkRepository: Repository<InviteLink>,
    @InjectRepository(WorkspaceInviteEmail)
    private readonly inviteEmailRepository: Repository<WorkspaceInviteEmail>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async createOrRegenerate(
    workspaceId: Workspace['id'],
    createdBy: User['id'],
  ): Promise<InviteLink> {
    // Delete existing link for this workspace, if any (one link per workspace)
    await this.inviteLinkRepository.delete({ workspaceId });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

    return this.inviteLinkRepository.save(
      this.inviteLinkRepository.create({ workspaceId, createdBy, token, expiresAt }),
    );
  }

  async findCurrent(workspaceId: Workspace['id']): Promise<InviteLink> {
    const link = await this.inviteLinkRepository.findOne({ where: { workspaceId } });
    if (!link) throw new NotFoundException('No invite link exists for this workspace');
    return link;
  }

  async updateExpiry(workspaceId: Workspace['id'], expiresAt: Date): Promise<InviteLink> {
    const link = await this.findCurrent(workspaceId);
    link.expiresAt = expiresAt;
    return this.inviteLinkRepository.save(link);
  }

  async revoke(workspaceId: Workspace['id']): Promise<void> {
    await this.inviteLinkRepository.delete({ workspaceId });
  }

  async addEmail(workspaceId: Workspace['id'], email: string): Promise<WorkspaceInviteEmail> {
    const link = await this.findCurrent(workspaceId);

    const existing = await this.inviteEmailRepository.findOne({
      where: { inviteLinkId: link.id, email },
    });
    if (existing) throw new ConflictException('Email is already invited');

    return this.inviteEmailRepository.save(
      this.inviteEmailRepository.create({ inviteLinkId: link.id, email }),
    );
  }

  async findEmails(workspaceId: Workspace['id']): Promise<WorkspaceInviteEmail[]> {
    const link = await this.findCurrent(workspaceId);
    return this.inviteEmailRepository.find({ where: { inviteLinkId: link.id } });
  }

  async removeEmail(workspaceId: Workspace['id'], emailId: string): Promise<void> {
    const link = await this.findCurrent(workspaceId);
    const email = await this.inviteEmailRepository.findOne({
      where: { id: emailId, inviteLinkId: link.id },
    });
    if (!email) throw new NotFoundException('Invited email not found');
    await this.inviteEmailRepository.remove(email);
  }

  async resolveToken(token: string): Promise<{ workspaceId: string; workspaceName: string }> {
    const link = await this.inviteLinkRepository.findOne({
      where: { token },
      relations: {
        workspace: true,
      },
    });

    if (!link || link.expiresAt < new Date()) {
      throw new NotFoundException('Invite link is invalid or has expired');
    }

    return {
      workspaceId: link.workspaceId,
      workspaceName: link.workspace.name,
    };
  }

  async join(token: string, user: User): Promise<WorkspaceMember> {
    const link = await this.inviteLinkRepository.findOne({ where: { token } });
    if (!link || link.expiresAt < new Date()) {
      throw new NotFoundException('Invite link is invalid or has expired');
    }

    const invitedEmail = await this.inviteEmailRepository.findOne({
      where: { inviteLinkId: link.id, email: user.email },
    });

    if (!invitedEmail) {
      throw new ForbiddenException('This email is not invited to join this workspace');
    }

    if (invitedEmail.acceptedByUserId) {
      throw new ConflictException('This invite has already been used');
    }

    const existingMembership = await this.workspaceMemberRepository.findOne({
      where: { userId: user.id, workspaceId: link.workspaceId },
    });
    if (existingMembership) {
      throw new ConflictException('You are already a member of this workspace');
    }

    invitedEmail.acceptedByUserId = user.id;
    await this.inviteEmailRepository.save(invitedEmail);

    return this.workspaceMemberRepository.save(
      this.workspaceMemberRepository.create({
        userId: user.id,
        workspaceId: link.workspaceId,
        role: WorkspaceRole.MEMBER,
      }),
    );
  }

  async validateForGuestAccess(token: string): Promise<InviteLink> {
    const link = await this.inviteLinkRepository.findOne({ where: { token } });
    if (!link || link.expiresAt < new Date()) {
      throw new NotFoundException('Invite link is invalid or has expired');
    }
    return link;
  }
}
