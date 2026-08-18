import { IsEmail } from 'class-validator';

export class AddInviteEmailDto {
  @IsEmail()
  email!: string;
}
