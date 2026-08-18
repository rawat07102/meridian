import { IsDateString } from 'class-validator';

export class UpdateInviteLinkExpiryDto {
  @IsDateString()
  expiresAt!: string;
}
