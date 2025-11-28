export interface Groomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string; // Only for registration
  address?: string;
  city?: string;
  state?: string;
  bio?: string;
  workingHours?: string;
  availableServices?: string;
  rating?: number;
  totalOrders?: number;
  totalEarnings?: number;
  isActive: boolean;
  isVerified?: boolean;
  isAvailableForOrders?: boolean;
  latitude?: number;
  longitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
  serviceRadius?: number; // Service radius in kilometers
  isOnline?: boolean; // Online status for order acceptance
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  petName: string;
  petType: string;
  serviceName: string;
  servicePrice: number;
  address: string;
  status: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  latitude?: number;
  longitude?: number;
  distanceFromGroomer?: number;
  serviceStartTime?: string;
  serviceEndTime?: string;
  preferredDate?: string;
  specialNotes?: string;
  groomerId?: number;
  createdAt?: string;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string; // mandatory now
  latitude?: number;
  longitude?: number;
  bio?: string;
  experienceYears?: number; // 0-20
  languages?: string[]; // e.g., ['English','Hindi','Tamil']
  resumeUrl?: string; // optional uploaded file URL
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  groomer: Groomer | null;
  token: string | null;
}

export interface GroomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  isAvailableForOrders?: boolean;
  rating?: number;
  totalOrders?: number;
  totalEarnings?: number;
  completedOrders?: number;
  completionRate?: number;
  averageRating?: number;
  totalReviews?: number;
  latitude?: number;
  longitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  serviceRadius?: number; // Service radius in kilometers
  isOnline?: boolean; // Online status for order acceptance
}

export interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  completedOrders: number;
  averageOrderValue: number;
  recentTransactions?: Order[];
  averageRating?: number; // Average rating from completed orders
}

export interface EarningsHistory {
  orderId: number;
  customerName: string;
  serviceName: string;
  amount: number;
  completedAt: string;
}

// Backend API Response Types
export interface BackendApiResponse {
  status: string;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  groomer: Groomer;
}

export interface GroomerStats {
  rating: number;
  totalOrders: number;
  completedOrders: number;
  totalEarnings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
}

export interface NearbyGroomerResponse {
  id: number;
  name: string;
  phone: string;
  rating: number;
  totalOrders: number;
  distanceKm: number;
}