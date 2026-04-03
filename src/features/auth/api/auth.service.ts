import api from '@/api/axios';
import {  type ForgotPasswordResponse, type ResetPasswordPayload } from '../types';

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
  },

  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (mobile: string): Promise<ForgotPasswordResponse> => {
    const response = await api.post(`/auth/forgot-password?mobile=${mobile}`);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordPayload) => {
    const response = await api.post('/auth/reset-password', null, {
      params: { 
        token: data.token, 
        new_password: data.new_password 
      }
    });
    return response.data;
  }
  
};

export const getPublicBuildings = async () => {
  const response = await api.get('/buildings');
  return response.data;
};