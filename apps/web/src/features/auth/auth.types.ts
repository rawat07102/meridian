export type UserSession = {
  type: 'user' | 'guest';
  id: string;
  accessToken: string;
  refreshToken: string;
};
