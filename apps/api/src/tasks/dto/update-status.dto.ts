import { IsEnum } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
