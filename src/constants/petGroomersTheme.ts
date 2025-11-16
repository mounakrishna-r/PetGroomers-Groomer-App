// PetGroomers Theme Configuration
// Colors extracted from https://petgroomers.in

export const PetGroomersTheme = {
  // Primary Brand Colors
  primary: {
    main: '#444CE7',        // vivid-cyan-blue (primary button/link color)
    light: '#8ED1FC',       // pale-cyan-blue
    dark: '#101828',        // global primary color (headings)
  },
  
  // Secondary Colors
  secondary: {
    main: '#FF6900',        // luminous-vivid-orange
    light: '#FCB900',       // luminous-vivid-amber
    dark: '#CF2E2E',        // vivid-red
  },
  
  // Text Colors
  text: {
    primary: '#1D2939',     // global heading color
    secondary: '#475467',   // global text color
    tertiary: '#98A2B3',    // global tertiary color
    white: '#FFFFFF',
    disabled: '#ABB8C3',    // cyan-bluish-gray
  },
  
  // Background Colors
  background: {
    primary: '#F9FAFB',     // global background color
    secondary: '#FFFFFF',   // white
    card: '#FFFFFF',
    input: '#F3F4F6',
    disabled: '#E5E7EB',
  },
  
  // Status Colors
  status: {
    success: '#00D084',     // vivid-green-cyan
    warning: '#FCB900',     // luminous-vivid-amber
    error: '#CF2E2E',       // vivid-red
    info: '#0693E3',        // vivid-cyan-blue
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(90deg, hsla(259, 84%, 78%, 1) 0%, hsla(206, 67%, 75%, 1) 100%)',
    secondary: 'linear-gradient(90deg, hsla(18, 76%, 85%, 1) 0%, hsla(203, 69%, 84%, 1) 100%)',
    success: 'linear-gradient(135deg, #7BDCB5 0%, #00D084 100%)', // light-green-cyan to vivid-green-cyan
  },
  
  // Component-specific colors
  switch: {
    trackActive: '#444CE7',
    trackInactive: '#E5E7EB',
    thumbActive: '#FFFFFF',
    thumbInactive: '#9CA3AF',
  },
  
  // Shadows
  shadow: {
    small: '0px 2px 4px rgba(16, 24, 40, 0.1)',
    medium: '0px 4px 8px rgba(16, 24, 40, 0.15)',
    large: '0px 8px 24px rgba(16, 24, 40, 0.2)',
  },
  
  // Spacing (following the website's spacing system)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border Radius
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export default PetGroomersTheme;