/**
 * TypeScript type definitions for user-related data structures
 */

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  dateOfBirth?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: SocialLinks;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  telegram?: string;
}

// User roles and permissions
export type UserRole = 'admin' | 'trader' | 'viewer' | 'analyst';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface Role {
  name: string;
  permissions: Permission[];
  description: string;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: NotificationPreferences;
  trading: TradingPreferences;
  dashboard: DashboardPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    strategySignals: boolean;
    systemAlerts: boolean;
    marketing: boolean;
  };
  push: {
    enabled: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    strategySignals: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    systemAlerts: boolean;
  };
  inApp: {
    enabled: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    strategySignals: boolean;
    systemAlerts: boolean;
  };
}

export interface TradingPreferences {
  defaultSymbol: string;
  defaultTimeframe: string;
  defaultOrderType: 'market' | 'limit' | 'stop';
  defaultQuantity: number;
  riskLevel: 'low' | 'medium' | 'high';
  autoConfirmOrders: boolean;
  showAdvancedOrderTypes: boolean;
  enableSoundAlerts: boolean;
  enableHapticFeedback: boolean;
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  defaultView: 'overview' | 'trading' | 'portfolio' | 'strategies';
  widgets: DashboardWidget[];
  refreshInterval: number;
  showWelcomeMessage: boolean;
  compactMode: boolean;
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: Record<string, any>;
  isVisible: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'friends';
  showTradingStats: boolean;
  showPortfolioValue: boolean;
  allowDataSharing: boolean;
  allowMarketingEmails: boolean;
  allowAnalytics: boolean;
}

// Authentication
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

// Password management
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

// Two-factor authentication
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  code: string;
  backupCode?: string;
}

// User settings
export interface UserSettings {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// User activity
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// User sessions
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

// User verification
export interface EmailVerification {
  email: string;
  token: string;
  expiresAt: string;
}

export interface PhoneVerification {
  phone: string;
  code: string;
  expiresAt: string;
}

// User statistics
export interface UserStats {
  userId: string;
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  accountAge: number; // in days
  lastActivity: string;
  strategiesCount: number;
  activeStrategies: number;
}

// User feedback
export interface UserFeedback {
  id: string;
  userId: string;
  type: 'bug_report' | 'feature_request' | 'general_feedback';
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// User support
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'trading' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'support';
  message: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}










