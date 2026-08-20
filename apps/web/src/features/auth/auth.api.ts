import api from '@/lib/api';
import { LoginData, SignupData, UserSession } from './auth.types';

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
    const res = await api.post('/auth/login', {
      email: 'guest@meridian.com',
      password: 'Password123!',
    });
    return {
      type: 'guest',
      id: 'mock-guest-id',
      accessToken: res.data.accesToken,
      refreshToken: res.data.refreshToken,
      // accessToken: 'guest-access-token',
      // refreshToken: 'guest-refresh-token',
    };
  },

  async login(_data: LoginData): Promise<UserSession> {
    return {
      type: 'user',
      id: 'mock-user-id',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  },
};

export default authApi;
