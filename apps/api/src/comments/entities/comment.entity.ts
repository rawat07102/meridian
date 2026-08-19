import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => Task)
  task!: Task;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: Task['id'];

  @ManyToOne(() => User)
  author!: User;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: User['id'];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
