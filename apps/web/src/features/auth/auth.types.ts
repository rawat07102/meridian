// export type GuestSession = {
//   type: 'guest';
//   accessToken: string;
//   workspaceId: string;
// };

export type UserSession = {
  type: 'user' | 'guest';
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

export type LoginData = {
  email: string;
  password: string;
};
