import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  IsHexColor,
} from 'class-validator';
import { ProjectPriority, ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectPriority)
  priority!: ProjectPriority;

  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @IsUUID()
  leadId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color' })
  color?: string;
}
