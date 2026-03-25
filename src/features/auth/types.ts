// src/features/auth/types.ts

export interface RegisterPayload {
  full_name: string;
  email?: string;
  mobile: string;
  password: string;
  flat_number?: string;
  building_name?: string;
}

export interface ForgotPasswordResponse {
  message?: string;
  reset_token?: string; // Returned in dev mode for testing
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}