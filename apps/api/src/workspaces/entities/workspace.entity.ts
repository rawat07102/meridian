import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkspaceMember } from './workspace-member.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members!: WorkspaceMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
