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
import { InviteLink } from './invite-link.entity';

@Entity('workspace_invite_emails')
@Unique(['inviteLinkId', 'email'])
export class WorkspaceInviteEmail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => InviteLink, (link) => link.allowedEmails)
  @JoinColumn({ name: 'invite_link_id' })
  inviteLink!: InviteLink;

  @Column({ name: 'invite_link_id', type: 'uuid' })
  inviteLinkId!: InviteLink['id'];

  @Column()
  email!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'accepted_by_user_id' })
  acceptedBy!: User | null;

  @Column({ name: 'accepted_by_user_id', type: 'uuid', nullable: true })
  acceptedByUserId!: User['id'] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
