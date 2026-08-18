import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class ReorderTaskDto {
  @IsEnum(TaskStatus)
  newStatus!: TaskStatus;

  @IsOptional()
  @IsUUID()
  prevTaskId?: string;

  @IsOptional()
  @IsUUID()
  nextTaskId?: string;
}
