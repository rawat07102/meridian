import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../config/auth.config';
import { GuestJwtPayload } from '../interfaces/guest-jwt-payload.interface';

@Injectable()
export class GuestJwtStrategy extends PassportStrategy(Strategy, 'guest-jwt') {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwtSecret!,
    });
  }

  validate(payload: GuestJwtPayload): GuestJwtPayload | null {
    if (payload.role !== 'guest') return null;
    return payload;
  }
}
