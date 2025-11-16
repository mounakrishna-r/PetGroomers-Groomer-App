import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Groomer, 
  Order, 
  LoginResponse, 
  RegisterRequest, 
  ApiResponse,
  OrderAssignmentRequest,
  OrderUpdateRequest
} from '../types';

interface LoginRequest {
  identifier: string;
  password?: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://896224f45e59.ngrok-free.app'; // Updated ngrok URL
const API_TIMEOUT = 10000;

// Debug logging
console.log('🔧 API Configuration:');
console.log('📡 BASE_URL:', BASE_URL);
console.log('🌍 ENV EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

// Test basic connectivity with fetch
const testConnectivity = async () => {
  try {
    console.log('🧪 Testing basic connectivity to:', BASE_URL);
    const response = await fetch(BASE_URL + '/api/services', {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Connectivity test status:', response.status);
    if (response.ok) {
      console.log('🎉 Backend is reachable!');
    } else {
      console.log('⚠️  Backend responded but with error status');
    }
  } catch (error: any) {
    console.error('❌ Connectivity test failed:', error.message);
  }
};

// Run connectivity test
testConnectivity();

// Create Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
  },
});

// Request interceptor to add auth token and ngrok headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('groomer-auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add ngrok bypass header for all requests
      config.headers['ngrok-skip-browser-warning'] = 'true';
      
    } catch (error) {
      console.warn('Failed to get auth token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      await AsyncStorage.multiRemove(['groomer-auth-token', 'groomer-data']);
      // You can emit an event here to redirect to login screen
    }
    return Promise.reject(error);
  }
);

export class GroomerAPI {
  // Alternative fetch-based login for testing
  static async loginWithFetch(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Testing fetch-based login...');
      const response = await fetch(BASE_URL + '/api/auth/groomer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Fetch response status:', response.status);
      const data = await response.json();
      console.log('📊 Fetch response data:', data);

      if (data.success && data.token) {
        await AsyncStorage.setItem('groomer-auth-token', data.token);
        await AsyncStorage.setItem('groomer-data', JSON.stringify(data.groomer));
      }

      return data;
    } catch (error: any) {
      console.error('❌ Fetch login error:', error.message);
      return {
        success: false,
        message: `Fetch login failed: ${error.message}`,
      };
    }
  }

  // Helper function to map backend groomer data to app format
  private static mapGroomerData(backendGroomer: any): Groomer {
    return {
      id: backendGroomer.id,
      name: backendGroomer.name,
      email: backendGroomer.email,
      phone: backendGroomer.phone,
      phoneNumber: backendGroomer.phone, // Map phone to phoneNumber for compatibility
      address: backendGroomer.address,
      experience: backendGroomer.bio,
      experienceYears: backendGroomer.totalOrders,
      rating: backendGroomer.rating || 0,
      totalReviews: backendGroomer.totalOrders || 0,
      completedOrders: backendGroomer.totalOrders || 0,
      profileImage: backendGroomer.profileImageUrl,
      isActive: backendGroomer.isActive || false,
      isAvailable: backendGroomer.isAvailable || false,
      createdAt: backendGroomer.createdAt,
      updatedAt: backendGroomer.updatedAt,
    };
  }

  // Authentication APIs - Using fetch since Axios has issues with ngrok
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🚀 Using fetch for login (Axios has ngrok issues)');
      console.log('📝 Login credentials:', { identifier: credentials.identifier, password: '***' });
      
      // Determine if identifier is email or phone
      const isEmail = credentials.identifier.includes('@');
      const requestBody: any = {
        password: credentials.password
      };
      
      if (isEmail) {
        requestBody.email = credentials.identifier;
        console.log('📧 Detected email login');
      } else {
        requestBody.phone = credentials.identifier;
        console.log('📱 Detected phone login');
      }
      
      console.log('📦 Request body:', { ...requestBody, password: '***' });
      
      // Use fetch instead of Axios (which works with ngrok)
      const response = await fetch(BASE_URL + '/api/auth/groomer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('✅ Fetch response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success && data.token && data.groomer) {
        // Map backend groomer data to app format
        const mappedGroomer = this.mapGroomerData(data.groomer);
        console.log('🔄 Mapped groomer data:', mappedGroomer);
        
        // Store token and groomer data
        await AsyncStorage.setItem('groomer-auth-token', data.token);
        await AsyncStorage.setItem('groomer-data', JSON.stringify(mappedGroomer));
        
        return {
          success: true,
          message: data.message,
          token: data.token,
          groomer: mappedGroomer,
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Fetch login error:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
      
      return {
        success: false,
        message: `Login failed: ${error.message}`,
      };
    }
  }

  static async register(groomerData: RegisterRequest): Promise<ApiResponse<Groomer>> {
    try {
      const response = await apiClient.post('/api/auth/groomer/register', groomerData);
      return {
        success: true,
        message: 'Registration initiated. Please verify your phone.',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  }

  static async sendOTP(phone: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/api/auth/groomer/send-otp', { phone });
      return {
        success: true,
        message: 'OTP sent successfully',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  static async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/api/auth/groomer/verify-otp', { phone, otp });
      
      if (response.data.success && response.data.token) {
        await AsyncStorage.setItem('groomer-auth-token', response.data.token);
        await AsyncStorage.setItem('groomer-data', JSON.stringify(response.data.groomer));
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed',
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/groomer/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove(['groomer-auth-token', 'groomer-data']);
    }
  }

  static async storeGroomerData(groomer: Groomer): Promise<void> {
    try {
      await AsyncStorage.setItem('groomer-data', JSON.stringify(groomer));
    } catch (error) {
      console.error('Error storing groomer data:', error);
    }
  }

  static async clearStoredData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['groomer-auth-token', 'groomer-data']);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  // Order Management APIs
  static async getAvailableOrders(groomerId: number, location?: { latitude: number; longitude: number }): Promise<Order[]> {
    try {
      const params: any = { groomerId };
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }
      
      const response = await apiClient.get('/api/groomer/orders/available', { params });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      return [];
    }
  }

  static async getAssignedOrders(groomerId: number): Promise<Order[]> {
    try {
      const response = await apiClient.get(`/api/groomer/orders/assigned/${groomerId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch assigned orders:', error);
      return [];
    }
  }

  static async acceptOrder(assignmentData: OrderAssignmentRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.post('/api/groomer/orders/accept', assignmentData);
      return {
        success: true,
        message: 'Order accepted successfully',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to accept order',
      };
    }
  }

  static async updateOrderStatus(updateData: OrderUpdateRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.put(`/api/groomer/orders/${updateData.orderId}/status`, updateData);
      return {
        success: true,
        message: 'Order updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order',
      };
    }
  }

  static async getOrderDetails(orderId: number): Promise<Order | null> {
    try {
      const response = await apiClient.get(`/api/groomer/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      return null;
    }
  }

  // Groomer Profile APIs
  static async getProfile(groomerId: number): Promise<Groomer | null> {
    try {
      const response = await apiClient.get(`/api/groomer/profile/${groomerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch groomer profile:', error);
      return null;
    }
  }

  static async updateAvailability(groomerId: number, isAvailable: boolean): Promise<ApiResponse> {
    try {
      const response = await apiClient.patch(`/api/groomer/${groomerId}/availability`, { isAvailable });
      return {
        success: true,
        message: 'Availability updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update availability',
      };
    }
  }

  static async updateProfile(groomer: Partial<Groomer>): Promise<ApiResponse<Groomer>> {
    try {
      const response = await apiClient.put('/api/groomer/profile', groomer);
      return {
        success: true,
        message: 'Profile updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  }



  // Earnings and Statistics
  static async getEarnings(groomerId: number, period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    try {
      const response = await apiClient.get(`/api/groomer/${groomerId}/earnings`, { 
        params: { period } 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      return { totalEarnings: 0, completedOrders: 0, period };
    }
  }

  // Utility Methods
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('groomer-auth-token');
    } catch (error) {
      return null;
    }
  }

  static async getStoredGroomerData(): Promise<Groomer | null> {
    try {
      const data = await AsyncStorage.getItem('groomer-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
}

export default GroomerAPI;