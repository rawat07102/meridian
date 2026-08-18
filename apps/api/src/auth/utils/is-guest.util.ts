import { GuestJwtPayload } from '../interfaces/guest-jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

export function isGuestPayload(user: User | GuestJwtPayload): user is GuestJwtPayload {
  return (user as GuestJwtPayload).role === 'guest';
}
