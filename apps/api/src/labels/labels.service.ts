import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
  ) {}

  async create(
    workspaceId: Workspace['id'],
    createdBy: User['id'],
    dto: CreateLabelDto,
  ): Promise<Label> {
    return this.labelRepository.save(
      this.labelRepository.create({ ...dto, workspaceId, createdBy }),
    );
  }

  async findAllForWorkspace(workspaceId: Workspace['id']): Promise<Label[]> {
    return this.labelRepository.find({ where: { workspaceId } });
  }

  async update(id: string, dto: UpdateLabelDto): Promise<Label> {
    const label = await this.fetchLabelOrFail(id);
    Object.assign(label, dto);
    return this.labelRepository.save(label);
  }

  async remove(id: string): Promise<void> {
    const label = await this.fetchLabelOrFail(id);
    await this.labelRepository.remove(label);
  }

  private async fetchLabelOrFail(id: string): Promise<Label> {
    const label = await this.labelRepository.findOne({ where: { id } });
    if (!label) throw new NotFoundException('Label not found');
    return label;
  }
}
