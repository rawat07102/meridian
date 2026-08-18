import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 7 })
  color!: string;

  @ManyToOne(() => Workspace)
  workspace!: Workspace;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: Workspace['id'];

  @ManyToOne(() => User)
  creator!: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: User['id'];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
