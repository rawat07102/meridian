import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../config/auth.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
  ) {
    super({
      clientID: config.googleClientId!,
      clientSecret: config.googleClientSecret!,
      callbackURL: config.googleCallbackUrl!,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    const givenName = profile.name?.givenName ?? '';
    const familyName = profile.name?.familyName ?? '';

    if (!email) {
      return done(new Error('No email account associated with this Google profile.'), false);
    }

    const fullName =
      `${givenName} ${familyName}`.trim() ||
      profile.displayName ||
      email.split('@')[0] ||
      'Anonymous Google User';

    const googleUser = {
      email,
      fullName,
    };

    done(null, googleUser);
  }
}
