import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectMember } from './project-member.entity';
import { Label } from '../../labels/entities/label.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectPriority {
  NO_PRIORITY = 'no_priority',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  priority!: ProjectPriority;

  @Column({ type: 'varchar' })
  status!: ProjectStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'lead_id' })
  lead!: User;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: User['id'];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: User['id'];

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId!: Workspace['id'];

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 7 })
  color!: string | null;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members!: ProjectMember[];

  @ManyToMany(() => Label)
  @JoinTable({ name: 'project_labels' })
  labels!: Label[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
