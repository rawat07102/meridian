export type GuestSession = {
  type: 'guest';
  accessToken: string;
  workspaceId: string;
};

export type UserSession = {
  type: 'user';
  id: string;
  accessToken: string;
  refreshToken: string;
};

export type SignupData = {
  email: string;
  password: string;
  fullName: string;
  username: string;
};
