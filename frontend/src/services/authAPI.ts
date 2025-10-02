import { get, post } from './api';

// Authentication API service
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  country: string;
  timezone: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  marketingConsent?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  isFirstLogin: boolean;
  requiresVerification: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  code: string;
  backupCode?: string;
}

class AuthAPI {
  private baseUrl = '/auth';

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return post<AuthResponse>(`${this.baseUrl}/login`, credentials);
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return post<AuthResponse>(`${this.baseUrl}/register`, data);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    return post<void>(`${this.baseUrl}/logout`);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return post<AuthTokens>(`${this.baseUrl}/refresh`, { refreshToken });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return get<User>(`${this.baseUrl}/me`);
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    return post<User>(`${this.baseUrl}/profile`, updates);
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return post<void>(`${this.baseUrl}/change-password`, data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: ResetPasswordRequest): Promise<void> {
    return post<void>(`${this.baseUrl}/forgot-password`, data);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: ResetPasswordConfirm): Promise<void> {
    return post<void>(`${this.baseUrl}/reset-password`, data);
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    return post<void>(`${this.baseUrl}/verify-email`, { token });
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    return post<void>(`${this.baseUrl}/resend-verification`);
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(): Promise<TwoFactorSetup> {
    return post<TwoFactorSetup>(`${this.baseUrl}/2fa/setup`);
  }

  /**
   * Verify two-factor authentication setup
   */
  async verifyTwoFactorSetup(data: TwoFactorVerify): Promise<void> {
    return post<void>(`${this.baseUrl}/2fa/verify`, data);
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(data: TwoFactorVerify): Promise<void> {
    return post<void>(`${this.baseUrl}/2fa/disable`, data);
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<any[]> {
    return get<any[]>(`${this.baseUrl}/sessions`);
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId: string): Promise<void> {
    return post<void>(`${this.baseUrl}/sessions/${sessionId}/revoke`);
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(): Promise<void> {
    return post<void>(`${this.baseUrl}/sessions/revoke-all`);
  }

  /**
   * Get user activity log
   */
  async getActivityLog(page: number = 1, limit: number = 20): Promise<any> {
    return get<any>(`${this.baseUrl}/activity?page=${page}&limit=${limit}`);
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    return post<void>(`${this.baseUrl}/delete-account`, { password });
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    return get<{ available: boolean }>(`${this.baseUrl}/check-email?email=${encodeURIComponent(email)}`);
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any> {
    return get<any>(`${this.baseUrl}/preferences`);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<any> {
    return post<any>(`${this.baseUrl}/preferences`, preferences);
  }

  /**
   * Get user notifications settings
   */
  async getNotificationSettings(): Promise<any> {
    return get<any>(`${this.baseUrl}/notifications/settings`);
  }

  /**
   * Update user notifications settings
   */
  async updateNotificationSettings(settings: any): Promise<any> {
    return post<any>(`${this.baseUrl}/notifications/settings`, settings);
  }

  /**
   * Get user API keys
   */
  async getApiKeys(): Promise<any[]> {
    return get<any[]>(`${this.baseUrl}/api-keys`);
  }

  /**
   * Create new API key
   */
  async createApiKey(name: string, permissions: string[]): Promise<any> {
    return post<any>(`${this.baseUrl}/api-keys`, { name, permissions });
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    return post<void>(`${this.baseUrl}/api-keys/${keyId}/revoke`);
  }

  /**
   * Get user security events
   */
  async getSecurityEvents(page: number = 1, limit: number = 20): Promise<any> {
    return get<any>(`${this.baseUrl}/security-events?page=${page}&limit=${limit}`);
  }

  /**
   * Enable security alerts
   */
  async enableSecurityAlerts(): Promise<void> {
    return post<void>(`${this.baseUrl}/security-alerts/enable`);
  }

  /**
   * Disable security alerts
   */
  async disableSecurityAlerts(): Promise<void> {
    return post<void>(`${this.baseUrl}/security-alerts/disable`);
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();
export default authAPI;










