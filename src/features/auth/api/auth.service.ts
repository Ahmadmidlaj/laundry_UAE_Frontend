import api from '@/api/axios';

export const authService = {
  login: async (formData: FormData) => {
    // Backend expects Form Data for /access-token
    const response = await api.post('/auth/login/access-token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  }
};