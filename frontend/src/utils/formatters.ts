/**
 * Utility functions for formatting data for display
 */

/**
 * Format currency values
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  showSign: boolean = true
): string => {
  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (value: number, decimals: number = 1): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  
  return value.toFixed(decimals);
};

/**
 * Format price with appropriate decimal places based on symbol
 */
export const formatPrice = (value: number, symbol: string): string => {
  // Forex pairs typically use 4-5 decimal places
  if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) {
    return value.toFixed(4);
  }
  
  // Crypto pairs typically use 2-8 decimal places
  if (symbol.includes('USDT') || symbol.includes('BTC')) {
    if (value >= 1000) return value.toFixed(2);
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(8);
  }
  
  // Commodities and indices
  if (symbol.includes('XAU') || symbol.includes('XAG')) {
    return value.toFixed(2);
  }
  
  // Default to 2 decimal places
  return value.toFixed(2);
};

/**
 * Format date and time
 */
export const formatDateTime = (
  date: string | Date,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    format?: 'short' | 'medium' | 'long';
  } = {}
): string => {
  const { includeTime = true, includeSeconds = false, format = 'medium' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : format === 'long' ? 'long' : 'numeric',
    day: 'numeric',
  };
  
  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    
    if (includeSeconds) {
      dateOptions.second = '2-digit';
    }
  }
  
  return new Intl.DateTimeFormat('en-US', dateOptions).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDateTime(dateObj, { format: 'short' });
  }
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(2)} ${sizes[i]}`;
};

/**
 * Format order status for display
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    filled: 'Filled',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    partially_filled: 'Partially Filled',
  };
  
  return statusMap[status] || status;
};

/**
 * Format order side for display
 */
export const formatOrderSide = (side: string): string => {
  return side === 'buy' ? 'Buy' : 'Sell';
};

/**
 * Format PnL with appropriate color class
 */
export const formatPnL = (value: number, includeSign: boolean = true): {
  formatted: string;
  className: string;
} => {
  const sign = includeSign && value > 0 ? '+' : '';
  const formatted = `${sign}${formatCurrency(value)}`;
  
  let className = 'text-gray-900';
  if (value > 0) {
    className = 'text-green-600';
  } else if (value < 0) {
    className = 'text-red-600';
  }
  
  return { formatted, className };
};

/**
 * Format risk level with appropriate styling
 */
export const formatRiskLevel = (level: string): {
  formatted: string;
  className: string;
  bgClassName: string;
} => {
  const levelMap: Record<string, { formatted: string; className: string; bgClassName: string }> = {
    low: {
      formatted: 'Low',
      className: 'text-green-600',
      bgClassName: 'bg-green-50 border-green-200',
    },
    medium: {
      formatted: 'Medium',
      className: 'text-yellow-600',
      bgClassName: 'bg-yellow-50 border-yellow-200',
    },
    high: {
      formatted: 'High',
      className: 'text-red-600',
      bgClassName: 'bg-red-50 border-red-200',
    },
  };
  
  return levelMap[level] || {
    formatted: level,
    className: 'text-gray-600',
    bgClassName: 'bg-gray-50 border-gray-200',
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
};

/**
 * Format credit card number (masked)
 */
export const formatCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
};










