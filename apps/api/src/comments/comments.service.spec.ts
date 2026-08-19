import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { PermissionsService } from '../permissions/permissions.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let taskRepository: { findOne: jest.Mock };
  let projectRepository: { findOne: jest.Mock };
  let permissionsService: {
    assertProjectMember: jest.Mock;
    assertCanDeleteComment: jest.Mock;
  };

  beforeEach(async () => {
    commentRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    taskRepository = { findOne: jest.fn() };
    projectRepository = { findOne: jest.fn() };
    permissionsService = {
      assertProjectMember: jest.fn(),
      assertCanDeleteComment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentRepository },
        { provide: getRepositoryToken(Task), useValue: taskRepository },
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should throw NotFoundException if the comment does not exist', async () => {
      commentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', 'user-1', { content: 'edited' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if the user is not the author', async () => {
      commentRepository.findOne.mockResolvedValue({
        id: 'comment-1',
        authorId: 'author-id',
        content: 'original',
      });

      await expect(
        service.update('comment-1', 'not-the-author', { content: 'edited' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update the comment when the user is the author', async () => {
      const comment = { id: 'comment-1', authorId: 'author-id', content: 'original' };
      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.update('comment-1', 'author-id', { content: 'edited' });

      expect(result.content).toBe('edited');
    });
  });

  describe('remove', () => {
    const comment = { id: 'comment-1', authorId: 'author-id', taskId: 'task-1' };
    const task = { id: 'task-1', projectId: 'project-1' };
    const project = { id: 'project-1', leadId: 'lead-id', workspaceId: 'workspace-1' };

    beforeEach(() => {
      commentRepository.findOne.mockResolvedValue(comment);
      taskRepository.findOne.mockResolvedValue(task);
      projectRepository.findOne.mockResolvedValue(project);
    });

    it('should throw ForbiddenException if the user is not author, Lead, or Admin', async () => {
      permissionsService.assertCanDeleteComment.mockRejectedValue(
        new ForbiddenException(
          'Only the comment author, project Lead, or a workspace Admin can delete comments',
        ),
      );

      await expect(service.remove('comment-1', 'random-user-id')).rejects.toThrow(
        ForbiddenException,
      );
      expect(commentRepository.remove).not.toHaveBeenCalled();
    });

    it('should remove the comment when the user is the author', async () => {
      permissionsService.assertCanDeleteComment.mockResolvedValue(undefined);
      commentRepository.remove.mockResolvedValue(comment);

      await service.remove('comment-1', 'author-id');

      expect(commentRepository.remove).toHaveBeenCalledWith(comment);
    });

    it('should remove the comment when the user is the project Lead', async () => {
      permissionsService.assertCanDeleteComment.mockResolvedValue(undefined);
      commentRepository.remove.mockResolvedValue(comment);

      await service.remove('comment-1', 'lead-id');

      expect(commentRepository.remove).toHaveBeenCalledWith(comment);
    });
  });
});
