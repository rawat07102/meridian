export interface GuestSession {
  type: 'guest';
  accessToken: string;
  workspaceId: string;
}

export interface UserSession {
  type: 'user';
  id: string;
  accessToken: string;
  refreshToken: string;
}
