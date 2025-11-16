// Type definitions for PetGroomers Groomer App
export interface Groomer {
  id?: number;
  name: string;
  email: string;
  phone: string;
  phoneNumber: string;
  address?: string;
  experience?: string;
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  completedOrders?: number;
  profileImage?: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  petName: string;
  petType: string;
  petBreed?: string;
  serviceName: string;
  servicePrice: number;
  address: string;
  status: OrderStatus;
  groomerName?: string;
  groomerPhone?: string;
  scheduledDateTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  preferredDate?: string;
  preferredTime?: string;
  specialNotes?: string;
  quotedPrice?: number;
  distance?: number; // Distance from groomer in km
  estimatedDuration?: number; // Estimated service duration in minutes
}

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface GroomingService {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  estimatedDurationMinutes: number;
  category: string;
  petType: string;
  iconName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  groomer?: Groomer;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  experience?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface OrderAssignmentRequest {
  orderId: number;
  groomerId: number;
  estimatedArrival?: string;
}

export interface OrderUpdateRequest {
  orderId: number;
  status: OrderStatus;
  notes?: string;
  completionPhotos?: string[];
}

// Navigation Types
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { phone: string; isRegistration?: boolean };
};

export type MainTabParamList = {
  Orders: undefined;
  Available: undefined;
  Profile: undefined;
  Earnings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OrderDetails: { orderId: number };
};

// Location and Map Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Location {
  latitudeDelta: number;
  longitudeDelta: number;
}