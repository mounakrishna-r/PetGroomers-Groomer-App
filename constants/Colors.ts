// PetGroomers Brand Colors (from logo)
export const Colors = {
  // Primary Brand Colors
  primary: '#e91e63', // Pink from logo
  secondary: '#2196f3', // Blue from logo
  
  // Pink Gradients
  pink: {
    light: '#f8bbd9',
    main: '#e91e63',
    dark: '#ad1457',
    gradient: ['#f8bbd9', '#e91e63'] as const
  },
  
  // Blue Gradients  
  blue: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2',
    gradient: ['#64b5f6', '#2196f3'] as const
  },
  
  // Status Colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#03dac6',
  
  // Neutral Colors
  background: '#f8f9fa',
  surface: '#ffffff',
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    disabled: '#adb5bd'
  },
  
  // Order Status Colors
  status: {
    pending: '#ff9800',
    assigned: '#2196f3', 
    inProgress: '#9c27b0',
    completed: '#4caf50',
    cancelled: '#f44336'
  },
  
  // Gradient Combinations
  gradients: {
    primary: ['#f8bbd9', '#e91e63'] as const,
    secondary: ['#64b5f6', '#2196f3'] as const,
    success: ['#81c784', '#4caf50'] as const,
    warm: ['#ffb74d', '#ff9800'] as const
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    header: 32
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const
  }
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999
};