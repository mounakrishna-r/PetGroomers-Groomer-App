import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the PetGroomers backend
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8090') + '/api';

// Helper function to make fetch requests with common headers
const makeFetchRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  // Log the request for debugging
  console.log('🌐 Making request to:', url);
  console.log('📋 Request method:', options.method || 'GET');
  console.log('📝 Request headers:', { ...defaultHeaders, ...options.headers });

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};

export interface Groomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  experience?: string;
  rating?: number;
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
  status: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
}

export interface LoginRequest {
  identifier: string; // email or phone
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  groomer?: Groomer;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  experience?: string;
}

class GroomerAPIService {
  private token: string | null = null;
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await this.loadToken();
      this.initialized = true;
    }
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('groomer-auth-token');
      this.token = token;
      // No need to set default headers with fetch, we'll add it per request
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem('groomer-auth-token', token);
      this.token = token;
      // No need to set default headers with fetch, we'll add it per request
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  private async removeToken() {
    try {
      await AsyncStorage.removeItem('groomer-auth-token');
      this.token = null;
      // No need to delete headers with fetch
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
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
      const response = await fetch(`${BASE_URL}/auth/groomer/login`, {
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
      
      if (data.success && data.token) {
        await this.saveToken(data.token);
        // Save groomer data
        await AsyncStorage.setItem('groomer-data', JSON.stringify(data.groomer));
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

  async register(groomerData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/auth/groomer/register`, {
        method: 'POST',
        body: JSON.stringify(groomerData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/auth/groomer/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.token) {
        await this.saveToken(data.token);
        await AsyncStorage.setItem('groomer-data', JSON.stringify(data.groomer));
      }
      
      return data;
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        message: error.message || 'OTP verification failed',
      };
    }
  }

  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Send OTP failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.token) {
        await this.saveToken(data.token);
      }
      
      return data;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await makeFetchRequest(`${BASE_URL}/auth/groomer/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.removeToken();
      await AsyncStorage.removeItem('groomer-data');
    }
  }

  // Order Management
  async getAssignedOrders(): Promise<Order[]> {
    try {
      // Ensure we're initialized and have a token
      await this.initialize();
      
      if (!this.token) {
        console.error('❌ No token available for getAssignedOrders');
        throw new Error('Authentication required. Please login again.');
      }
      
      // Get groomer data to extract groomerId
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData?.id) {
        console.error('❌ No groomer ID found for getAssignedOrders');
        throw new Error('Groomer information not found. Please login again.');
      }
      
      console.log('🔑 Using token for getAssignedOrders:', this.token.substring(0, 20) + '...');
      console.log('👤 Using groomer ID:', groomerData.id);
      
      const response = await makeFetchRequest(`${BASE_URL}/groomer/orders/assigned/${groomerData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      console.log('📊 getAssignedOrders response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('🚫 Token appears to be invalid or expired');
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.orders || []);
    } catch (error) {
      console.error('Failed to fetch assigned orders:', error);
      throw error;
    }
  }

  async getAvailableOrders(): Promise<Order[]> {
    try {
      // Ensure we're initialized and have a token
      await this.initialize();
      
      if (!this.token) {
        console.error('❌ No token available for getAvailableOrders');
        throw new Error('Authentication required. Please login again.');
      }
      
      // Get groomer data to extract groomerId (required by backend)
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData?.id) {
        console.error('❌ No groomer ID found for getAvailableOrders');
        throw new Error('Groomer information not found. Please login again.');
      }
      
      console.log('🔑 Using token for getAvailableOrders:', this.token.substring(0, 20) + '...');
      console.log('👤 Using groomer ID:', groomerData.id);
      
      // Add groomerId as query parameter as required by backend
      const url = `${BASE_URL}/groomer/orders/available?groomerId=${groomerData.id}`;
      
      const response = await makeFetchRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      console.log('📊 getAvailableOrders response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('🚫 Token appears to be invalid or expired');
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.orders || []);
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      throw error;
    }
  }

  async acceptOrder(orderId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to accept order:', error);
      return {
        success: false,
        message: error.message || 'Failed to accept order',
      };
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      return {
        success: false,
        message: error.message || 'Failed to update order status',
      };
    }
  }

  async completeOrder(orderId: number, completionNotes?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ completionNotes }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      return {
        success: false,
        message: error.message || 'Failed to complete order',
      };
    }
  }

  // Profile Management
  async updateProfile(updates: Partial<Groomer>): Promise<{ success: boolean; message: string; groomer?: Groomer }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.groomer) {
        await AsyncStorage.setItem('groomer-data', JSON.stringify(data.groomer));
      }
      
      return data;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile',
      };
    }
  }

  async updateAvailability(groomerId: number, isAvailable: boolean): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Updating availability with fetch (Axios has ngrok issues)');
      console.log('📊 Availability data:', { groomerId, isAvailable });
      
      // Ensure we have a token
      await this.loadToken();
      if (!this.token) {
        return {
          success: false,
          message: 'Authentication required. Please login again.',
        };
      }
      
      console.log('🔐 Using token for availability update');
      
      // Use fetch instead of Axios (which works with ngrok)
      const response = await fetch(`${BASE_URL}/groomer/${groomerId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ isAvailable }),
      });
      
      console.log('✅ Update availability response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('📦 Raw response text:', responseText);
      console.log('📏 Response text length:', responseText.length);
      console.log('🔍 Response content type:', response.headers.get('content-type'));
      
      // If response is successful (2xx) but empty, treat as success
      if (response.ok && (!responseText || responseText.trim() === '')) {
        console.log('✅ Empty response but HTTP status is OK, treating as success');
        return {
          success: true,
          message: 'Availability updated successfully'
        };
      }
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : { status: 'success', message: 'Updated successfully' };
      } catch (parseError) {
        console.log('⚠️ Failed to parse JSON, but HTTP status is OK, treating as success:', parseError);
        return {
          success: true,
          message: 'Availability updated successfully'
        };
      }
      
      console.log('📦 Parsed response data:', data);
      
      // Convert backend response format to app format
      // Check both 'status' and 'success' fields for compatibility
      const isSuccess = data.status === 'success' || data.success === true;
      return {
        success: isSuccess,
        message: data.message || 'Updated successfully'
      };
    } catch (error: any) {
      console.error('❌ Failed to update availability:', {
        message: error.message,
        name: error.name,
      });
      
      return {
        success: false,
        message: error.message?.includes('HTTP') ? error.message : 'Network error. Please check your connection and try again.',
      };
    }
  }

  // Analytics & Earnings
  async getEarnings(period: 'today' | 'week' | 'month' = 'month'): Promise<{
    totalEarnings: number;
    completedOrders: number;
    averageRating: number;
    period: string;
  }> {
    try {
      const response = await makeFetchRequest(`${BASE_URL}/groomer/earnings?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      return {
        totalEarnings: 0,
        completedOrders: 0,
        averageRating: 0,
        period,
      };
    }
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  async getStoredGroomerData(): Promise<Groomer | null> {
    try {
      const data = await AsyncStorage.getItem('groomer-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stored groomer data:', error);
      return null;
    }
  }

  async storeGroomerData(groomer: Groomer): Promise<void> {
    try {
      await AsyncStorage.setItem('groomer-data', JSON.stringify(groomer));
      console.log('✅ Groomer data stored successfully');
    } catch (error) {
      console.error('❌ Failed to store groomer data:', error);
    }
  }

  async clearStoredData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['groomer-auth-token', 'groomer-data']);
      this.token = null;
      console.log('✅ All stored data cleared');
    } catch (error) {
      console.error('❌ Failed to clear stored data:', error);
    }
  }
}

export default new GroomerAPIService();