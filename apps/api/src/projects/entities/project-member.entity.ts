import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('project_members')
@Unique(['userId', 'projectId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: User['id'];

  @ManyToOne(() => Project, (project) => project.members)
  project!: Project;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}
