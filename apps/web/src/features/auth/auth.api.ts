import { GuestSession, SignupData, UserSession } from './auth.types';

const authApi = {
  async signup(_data: SignupData): Promise<UserSession> {
    return {
      type: 'user',
      id: 'mock-user-id',
      accessToken: 'user-access-token',
      refreshToken: 'user-refresh-token',
    };
  },
  async loginAsGuest(): Promise<GuestSession> {
    return {
      type: 'guest',
      accessToken: 'guest-access-token',
      workspaceId: 'mock-workspace-id',
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
