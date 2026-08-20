import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';

export enum WorkspaceRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('workspace_members')
@Unique(['userId', 'workspaceId'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column({ name: 'user_id' })
  @JoinColumn({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.members)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @Column({ name: 'workspace_id' })
  workspaceId!: string;

  @Column({ type: 'varchar' })
  role!: WorkspaceRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}
