export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  avatarUrl?: string;
  isKycVerified: boolean;
  dob?: string;
  documentId?: string;
  country?: string;
}

export interface LoginCredentials { email: string; password: string }
export interface AuthResponse { token: string; user: AuthUser }
export interface RegisterInput extends LoginCredentials {
  name: string;
  username: string;
  role?: string;
  dob?: string;
  documentId?: string;
  country?: string;
}
export interface ResetPasswordInput { token: string; password: string; confirmPassword: string }
export interface AuthMessage { message: string }
