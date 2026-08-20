import { SignupData, UserSession } from './auth.types';

const authApi = {
  async signup(_data: SignupData): Promise<UserSession> {
    return {
      type: 'user',
      id: 'mock-user-id',
      accessToken: 'user-access-token',
      refreshToken: 'user-refresh-token',
    };
  },

  async loginAsGuest(): Promise<UserSession> {
    return {
      type: 'guest',
      id: 'mock-guest-id',
      accessToken: 'guest-access-token',
      refreshToken: 'guest-refresh-token',
    };
  },

  async login(_email: string, _password: string): Promise<UserSession> {
    return {
      type: 'user',
      id: 'mock-user-id',
      accessToken: 'user-access-token',
      refreshToken: 'user-refresh-token',
    };
  },
};

export default authApi;
