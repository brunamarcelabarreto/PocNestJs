import { client } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    client.post('/api/auth/login', { email, password }).then((r) => r.data),

  register: (tenantName: string, adminName: string, email: string, password: string) =>
    client
      .post('/api/auth/register-tenant', { tenantName, adminName, email, password })
      .then((r) => r.data),

  refresh: (refreshToken: string) =>
    client.post('/api/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    client.post('/api/auth/logout', { refreshToken }).then((r) => r.data),
};
