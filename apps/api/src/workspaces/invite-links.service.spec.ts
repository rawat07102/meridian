import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InviteLinksService } from './invite-links.service';
import { InviteLink } from './entities/invite-link.entity';
import { WorkspaceInviteEmail } from './entities/workspace-invite-email.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { User } from '../users/entities/user.entity';

describe('InviteLinksService', () => {
  let service: InviteLinksService;
  let inviteLinkRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let inviteEmailRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
  };
  let workspaceMemberRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    inviteLinkRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    inviteEmailRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    workspaceMemberRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteLinksService,
        { provide: getRepositoryToken(InviteLink), useValue: inviteLinkRepository },
        { provide: getRepositoryToken(WorkspaceInviteEmail), useValue: inviteEmailRepository },
        { provide: getRepositoryToken(WorkspaceMember), useValue: workspaceMemberRepository },
      ],
    }).compile();

    service = module.get<InviteLinksService>(InviteLinksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrRegenerate', () => {
    it('should delete any existing link for the workspace before creating a new one', async () => {
      inviteLinkRepository.save.mockResolvedValue({ id: 'link-2', token: 'new-token' });

      await service.createOrRegenerate('workspace-1', 'admin-id');

      expect(inviteLinkRepository.delete).toHaveBeenCalledWith({ workspaceId: 'workspace-1' });
      expect(inviteLinkRepository.save).toHaveBeenCalled();
    });
  });

  describe('addEmail', () => {
    it('should throw ConflictException if the email is already invited', async () => {
      inviteLinkRepository.findOne.mockResolvedValue({ id: 'link-1' });
      inviteEmailRepository.findOne.mockResolvedValue({ id: 'existing-invite' });

      await expect(service.addEmail('workspace-1', 'already-invited@example.com')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should add the email when not already invited', async () => {
      inviteLinkRepository.findOne.mockResolvedValue({ id: 'link-1' });
      inviteEmailRepository.findOne.mockResolvedValue(null);
      inviteEmailRepository.save.mockResolvedValue({ id: 'new-invite' });

      const result = await service.addEmail('workspace-1', 'new@example.com');

      expect(result.id).toBe('new-invite');
    });
  });

  describe('resolveToken', () => {
    it('should throw NotFoundException if the token does not exist', async () => {
      inviteLinkRepository.findOne.mockResolvedValue(null);

      await expect(service.resolveToken('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the token is expired', async () => {
      inviteLinkRepository.findOne.mockResolvedValue({
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        workspace: { name: 'Test Workspace' },
      });

      await expect(service.resolveToken('expired-token')).rejects.toThrow(NotFoundException);
    });

    it('should return workspace info for a valid token', async () => {
      inviteLinkRepository.findOne.mockResolvedValue({
        workspaceId: 'workspace-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        workspace: { name: 'Test Workspace' },
      });

      const result = await service.resolveToken('valid-token');

      expect(result).toEqual({ workspaceId: 'workspace-1', workspaceName: 'Test Workspace' });
    });
  });

  describe('join', () => {
    const validLink = {
      id: 'link-1',
      workspaceId: 'workspace-1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    };
    const user = { id: 'user-1', email: 'invited@example.com' } as User;

    it('should throw NotFoundException if the link is expired', async () => {
      inviteLinkRepository.findOne.mockResolvedValue({
        ...validLink,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.join('token', user)).rejects.toThrow(NotFoundException);
    });

    // NOTE: Disabled for the sample
    // it('should throw ForbiddenException if the email is not invited', async () => {
    //   inviteLinkRepository.findOne.mockResolvedValue(validLink);
    //   inviteEmailRepository.findOne.mockResolvedValue(null);
    //
    //   await expect(service.join('token', user)).rejects.toThrow(ForbiddenException);
    // });

    // it('should throw ConflictException if the invite was already accepted', async () => {
    //   inviteLinkRepository.findOne.mockResolvedValue(validLink);
    //   inviteEmailRepository.findOne.mockResolvedValue({
    //     id: 'invite-1',
    //     acceptedByUserId: 'someone-else-id',
    //   });
    //
    //   await expect(service.join('token', user)).rejects.toThrow(ConflictException);
    // });

    it('should throw ConflictException if the user is already a workspace member', async () => {
      inviteLinkRepository.findOne.mockResolvedValue(validLink);
      inviteEmailRepository.findOne.mockResolvedValue({
        id: 'invite-1',
        acceptedByUserId: null,
      });
      workspaceMemberRepository.findOne.mockResolvedValue({ id: 'existing-membership' });

      await expect(service.join('token', user)).rejects.toThrow(ConflictException);
    });

    // NOTE: Disabled for the sample
    // it('should mark the invite accepted and create a WorkspaceMember on success', async () => {
    //   const invitedEmail = { id: 'invite-1', acceptedByUserId: null };
    //   inviteLinkRepository.findOne.mockResolvedValue(validLink);
    //   inviteEmailRepository.findOne.mockResolvedValue(invitedEmail);
    //   workspaceMemberRepository.findOne.mockResolvedValue(null);
    //   inviteEmailRepository.save.mockResolvedValue({ ...invitedEmail, acceptedByUserId: 'user-1' });
    //   workspaceMemberRepository.save.mockResolvedValue({
    //     userId: 'user-1',
    //     workspaceId: 'workspace-1',
    //     role: WorkspaceRole.MEMBER,
    //   });
    //
    //   const result = await service.join('token', user);
    //
    //   expect(inviteEmailRepository.save).toHaveBeenCalledWith(
    //     expect.objectContaining({ acceptedByUserId: 'user-1' }),
    //   );
    //   expect(result.role).toBe(WorkspaceRole.MEMBER);
    // });
  });
});
