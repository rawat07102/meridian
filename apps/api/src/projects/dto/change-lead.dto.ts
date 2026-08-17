import { IsUUID } from 'class-validator';

export class ChangeLeadDto {
  @IsUUID()
  newLeadId!: string;
}
