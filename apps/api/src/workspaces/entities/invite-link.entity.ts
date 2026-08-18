import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspaceInviteEmail } from './workspace-invite-email.entity';

@Entity('invite_links')
export class InviteLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => Workspace)
  workspace!: Workspace;

  @Column({ name: 'workspace_id', type: 'uuid', unique: true })
  workspaceId!: Workspace['id'];

  @ManyToOne(() => User)
  creator!: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: User['id'];

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @OneToMany(() => WorkspaceInviteEmail, (email) => email.inviteLink)
  allowedEmails!: WorkspaceInviteEmail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
