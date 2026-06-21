export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export const AUTH_EVENT = {
  LOGOUT: 'auth:logout',
} as const;

export const USER_ROLE = {
  ADMIN: 'ADMIN',
} as const;

export const API_AUTH_PATH = '/api/auth/';
