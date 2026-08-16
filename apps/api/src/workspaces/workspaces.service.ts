import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(userId: User['id'], dto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = await this.workspaceRepository.save(
      this.workspaceRepository.create({ name: dto.name, ownerId: userId }),
    );

    await this.workspaceMemberRepository.save(
      this.workspaceMemberRepository.create({
        userId,
        workspaceId: workspace.id,
        role: WorkspaceRole.ADMIN,
      }),
    );
    return workspace;
  }

  async findAllForUser(userId: User['id']): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: {
        members: {
          userId,
        },
      },
    });
  }

  async findOne(id: Workspace['id']): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOneBy({
      id,
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(
    id: Workspace['id'],
    userId: User['id'],
    dto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id);
    await this.permissionsService.assertWorkspaceAdmin(userId, workspace.id);
    this.workspaceRepository.merge(workspace, dto);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: Workspace['id'], userId: User['id']): Promise<void> {
    const workspace = await this.findOne(id);
    if (workspace.ownerId !== userId)
      throw new ForbiddenException('Only the workspace owner can delete it');
    await this.workspaceRepository.remove(workspace);
  }
}
