// src/features/user/api/user.service.ts
import api from '@/api/axios';

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  flat_number?: string;
  building_name?: string;
  // role is excluded here because the backend guards it
}

export const userService = {
  // Fetch current user details
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update current user details
  updateMe: async (data: UserUpdatePayload) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  }
};