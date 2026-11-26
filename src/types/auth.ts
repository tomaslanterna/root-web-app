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
  /** Perfil privado: seguir requiere que la persona acepte la solicitud. */
  isPrivate?: boolean;
  /** Cuándo aceptó Términos y Privacidad. Si falta, se pide en /complete-profile. */
  termsAcceptedAt?: string | null;
}

/** Relación con un perfil: lo seguís, le pediste seguirlo (privado) o ninguna. */
export type FollowStatus = "none" | "requested" | "following";

export interface LoginCredentials { email: string; password: string }
export interface AuthResponse { token: string; user: AuthUser }
export interface RegisterInput extends LoginCredentials {
  name: string;
  username: string;
  role?: string;
  dob?: string;
  documentId?: string;
  country?: string;
  /** Obligatorio: el backend rechaza el registro (400) si no es true. */
  acceptedTerms: true;
  termsVersion: string;
}
export interface ResetPasswordInput { token: string; password: string; confirmPassword: string }
export interface AuthMessage { message: string }
