import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { InviteLink } from './entities/invite-link.entity';
import { WorkspaceInviteEmail } from './entities/workspace-invite-email.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { User } from '../users/entities/user.entity';

const DEFAULT_EXPIRY_DAYS = 30;

@Injectable()
export class InviteLinksService {
  constructor(
    @InjectRepository(InviteLink)
    private readonly inviteLinkRepository: Repository<InviteLink>,
    @InjectRepository(WorkspaceInviteEmail)
    private readonly inviteEmailRepository: Repository<WorkspaceInviteEmail>,
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
}
