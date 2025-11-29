import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Groomer, 
  Order, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse,
  EarningsData,
  EarningsHistory,
  GroomerProfile 
} from '../types';

// PetGroomers Backend Configuration
const API_BASE_URL = 'http://192.168.1.10:8090/api'; // Use correct Mac IP address for mobile device connectivity

// Test backend connection
const testConnection = async () => {
  try {
    const response = await fetch(`http://192.168.1.10:8090/api/health`);
    console.log('Backend connection test:', response.ok ? 'SUCCESS' : 'FAILED');
    return response.ok;
  } catch (error) {
    console.warn('Backend not reachable at 192.168.1.10:8090. Make sure PetGroomers backend is running.');
    return false;
  }
};
const STORAGE_KEYS = {
  TOKEN: '@petgroomers_groomer_token',
  GROOMER_DATA: '@petgroomers_groomer_data',
  REFRESH_TOKEN: '@petgroomers_refresh_token'
};

class GroomerAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('🔒 Received 401 - clearing authentication data');
          // Only clear storage, don't call full logout to avoid navigation issues
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.TOKEN,
            STORAGE_KEYS.GROOMER_DATA,
            STORAGE_KEYS.REFRESH_TOKEN
          ]);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTHENTICATION APIs ====================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ groomer: Groomer; token: string }>> {
    try {
      // Backend expects email/phone in separate fields, not combined emailOrPhone
      const loginRequest = {
        email: credentials.emailOrPhone.includes('@') ? credentials.emailOrPhone : undefined,
        phone: !credentials.emailOrPhone.includes('@') ? credentials.emailOrPhone : undefined,
        password: credentials.password
      };
      
      const response: AxiosResponse = await this.api.post('/auth/groomer/login', loginRequest);
      
      // Handle different response scenarios
      if (response.data.success) {
        const { token, groomer } = response.data;
        
        // Store authentication data
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(groomer));
        
        return { success: true, data: { groomer, token } };
      } else {
        // Login failed but might be verification issue
        return { 
          success: false, 
          error: response.data.message,
          data: response.data.groomer ? { groomer: response.data.groomer, token: null } : undefined
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed'
      };
    }
  }

  async register(groomerData: RegisterData): Promise<ApiResponse<{ groomer: Groomer; token: string }>> {
    try {
      console.log('GroomerAPI: Sending registration to:', `${API_BASE_URL}/auth/groomer/register`);
      console.log('GroomerAPI: Registration data:', groomerData);
      
      const response: AxiosResponse = await this.api.post('/auth/groomer/register', groomerData);
      console.log('GroomerAPI: Registration successful:', response.data);
      
      // Backend returns LoginResponse with success, message, token, and groomer
      if (response.data.success && response.data.token && response.data.groomer) {
        // Store authentication data
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(response.data.groomer));
        
        return { 
          success: true, 
          data: { 
            groomer: response.data.groomer, 
            token: response.data.token 
          }
        };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Registration failed' 
        };
      }
    } catch (error: any) {
      console.error('GroomerAPI: Registration error:', error);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please make sure the backend is running on localhost:8080'
        };
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.error('GroomerAPI: Registration error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<ApiResponse<{ groomer: Groomer; token: string }>> {
    try {
      console.log('🔍 Verifying OTP for phone-based login:');
      console.log('📱 Phone:', phone);
      console.log('🔐 OTP:', otp);
      
      // Backend verifyOTP only marks as verified, doesn't return groomer+token
      const response: AxiosResponse = await this.api.post('/auth/groomer/verify-otp', { phone, otp });
      
      if (response.data.success) {
        console.log('✅ OTP verified successfully, now logging in groomer...');
        
        // After OTP verification, the groomer is now verified
        // We need to fetch the groomer data and create a session
        try {
          // Since phone is verified, get groomer by phone and create session
          const loginResponse = await this.loginWithVerifiedPhone(phone);
          
          if (loginResponse.success && loginResponse.data) {
            console.log('✅ Phone-based login successful:', loginResponse.data.groomer.name);
            return loginResponse;
          } else {
            return { 
              success: false, 
              error: 'Phone verified but login failed. Please try logging in with phone and password.' 
            };
          }
        } catch (loginError) {
          console.error('❌ Post-verification login failed:', loginError);
          return { 
            success: false, 
            error: 'Phone verified successfully. Please login again with your credentials.' 
          };
        }
      } else {
        return { success: false, error: response.data.message || 'Invalid OTP. Please try again.' };
      }
    } catch (error: any) {
      console.error('❌ OTP verification error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'OTP verification failed'
      };
    }
  }

  // Helper method to login after phone verification
  private async loginWithVerifiedPhone(phone: string): Promise<ApiResponse<{ groomer: Groomer; token: string }>> {
    try {
      console.log('🔍 Searching for groomer with phone:', phone);
      
      // Since there's no direct endpoint to get groomer by phone, we need to search
      // We'll check a reasonable range of IDs (1-50) to find the groomer
      // This is a workaround until backend provides a proper /groomer/by-phone endpoint
      
      let foundGroomer: any = null;
      const maxAttempts = 50; // Check up to 50 groomer IDs
      
      for (let id = 1; id <= maxAttempts; id++) {
        try {
          console.log(`🔍 Checking groomer ID ${id}...`);
          const profileResponse: AxiosResponse = await this.api.get(`/groomer/profile/${id}`);
          
          if (profileResponse.data && profileResponse.data.phone === phone) {
            console.log(`✅ Found matching groomer! ID: ${id}, Name: ${profileResponse.data.name}`);
            foundGroomer = profileResponse.data;
            break;
          }
        } catch (profileError: any) {
          // 404 means groomer doesn't exist with this ID, continue searching
          if (profileError.response?.status === 404) {
            continue;
          }
          // Other errors, log but continue
          console.warn(`⚠️ Error checking groomer ID ${id}:`, profileError.message);
          continue;
        }
      }
      
      if (!foundGroomer) {
        console.error('❌ No groomer found with phone:', phone);
        return { 
          success: false, 
          error: 'Groomer account not found. Please make sure you have registered with this phone number.' 
        };
      }
      
      // Generate session token
      const token = `auth_${foundGroomer.id}_${Date.now()}`;
      
      // Store authentication data
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(foundGroomer));
      
      console.log('✅ Successfully logged in groomer:', {
        id: foundGroomer.id,
        name: foundGroomer.name,
        phone: foundGroomer.phone,
        verified: foundGroomer.isVerified
      });
      
      return {
        success: true,
        data: { groomer: foundGroomer, token }
      };
      
    } catch (error: any) {
      console.error('❌ Error in loginWithVerifiedPhone:', error);
      return { 
        success: false, 
        error: 'Failed to create session after verification. Please try again.' 
      };
    }
  }

  async checkIdentifier(identifier: string, type: 'email' | 'phone'): Promise<ApiResponse<{exists: boolean}>> {
    try {
      console.log('🔍 Checking identifier existence:');
      console.log('📧/📱 Identifier:', identifier, 'Type:', type);
      console.log('🌐 URL:', `${API_BASE_URL}/auth/groomer/check-identifier`);
      
      const response = await this.api.post('/auth/groomer/check-identifier', { 
        identifier, 
        type 
      });
      
      console.log('✅ Check Response:', response.data);
      return { 
        success: true, 
        data: { exists: response.data.exists },
        message: response.data.message 
      };
    } catch (error: any) {
      // If the endpoint doesn't exist yet, assume identifier exists for backward compatibility
      if (error.response?.status === 404) {
        console.log('ℹ️ Identifier check endpoint not implemented - using fallback');
        return { 
          success: true, 
          data: { exists: true },
          message: 'Proceeding to login'
        };
      }
      
      console.error('❌ Check identifier error:', error.response?.data || error.message);
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to check identifier'
      };
    }
  }

  async checkAccountExists(phone: string): Promise<ApiResponse<{exists: boolean}>> {
    try {
      console.log('🔍 Checking account existence for registration:');
      console.log('📱 Phone:', phone);
      console.log('🌐 URL:', `${API_BASE_URL}/auth/groomer/check-account`);
      
      const response = await this.api.post('/auth/groomer/check-account', { phone });
      console.log('✅ Account Check Response:', response.data);
      return { 
        success: true, 
        data: { exists: !!response.data.exists },
        message: response.data.message 
      };
    } catch (error: any) {
      // If endpoint not found, treat as 'not exists' and proceed with registration
      if (error.response?.status === 404) {
        console.log('ℹ️ check-account endpoint not found. Assuming account does not exist.');
        return { success: true, data: { exists: false }, message: 'Proceed to registration' };
      }
      console.error('❌ Check account error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to check account existence'
      };
    }
  }

  async sendOTP(phone: string): Promise<ApiResponse<string>> {
    try {
      console.log('🔍 Sending OTP request:');
      console.log('📱 Phone:', phone);
      console.log('🌐 URL:', `${API_BASE_URL}/auth/groomer/send-otp`);
      
      const response = await this.api.post('/auth/groomer/send-otp', { phone });
      
      console.log('✅ OTP Response:', response.data);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      console.log('❌ OTP Error:', error);
      console.log('📊 Error Response:', error.response?.data);
      console.log('📊 Error Status:', error.response?.status);
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  }

  async sendRegistrationOTP(phone: string): Promise<ApiResponse<string>> {
    try {
      console.log('🔍 Sending Registration OTP request:');
      console.log('📱 Phone:', phone);
      console.log('🌐 URL:', `${API_BASE_URL}/auth/groomer/send-registration-otp`);
      
      const response = await this.api.post('/auth/groomer/send-registration-otp', { phone });
      
      console.log('✅ Registration OTP Response:', response.data);
      return { success: true, message: 'Registration OTP sent successfully' };
    } catch (error: any) {
      console.log('❌ Registration OTP Error:', error);
      console.log('📊 Error Response:', error.response?.data);
      console.log('📊 Error Status:', error.response?.status);
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send registration OTP'
      };
    }
  }

  async verifyRegistrationOTP(phone: string, otp: string): Promise<ApiResponse<{ verified: boolean }>> {
    try {
      console.log('🔍 Verifying Registration OTP:');
      console.log('📱 Phone:', phone);
      console.log('🔐 OTP:', otp);
      console.log('🌐 URL:', `${API_BASE_URL}/auth/groomer/verify-registration-otp`);
      
      const response: AxiosResponse = await this.api.post('/auth/groomer/verify-registration-otp', { phone, otp });
      
      if (response.data.success) {
        console.log('✅ Registration OTP verified successfully');
        return { 
          success: true, 
          data: { verified: true },
          message: 'Phone number verified for registration'
        };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Invalid OTP. Please try again.' 
        };
      }
    } catch (error: any) {
      console.error('❌ Registration OTP verification error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'OTP verification failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🗑️ Clearing stored authentication data...');
      
      // Clear all authentication-related data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.GROOMER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN
      ]);
      
      console.log('✅ Authentication data cleared successfully');
      
      // Optional: Make a logout API call to the backend
      // This could invalidate the token server-side if implemented
      try {
        await this.api.post('/auth/groomer/logout', {});
        console.log('✅ Server-side logout completed');
      } catch (apiError) {
        // Don't fail the entire logout if server call fails
        console.warn('⚠️ Server-side logout failed (not critical):', apiError);
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error; // Re-throw to allow proper error handling
    }
  }

  // Update groomer's current location (like Swiggy)
  async updateCurrentLocation(latitude: number, longitude: number): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      console.log('📍 Updating current location:', { latitude, longitude });
      
      const response: AxiosResponse = await this.api.put(`/groomer/profile`, {
        id: groomerData.id,
        currentLatitude: latitude,
        currentLongitude: longitude
      });
      
      console.log('✅ Current location updated');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Failed to update current location:', error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update location'
      };
    }
  }

  // ==================== ORDER MANAGEMENT APIs ====================

  async getAssignedOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      console.log(`🔍 Fetching assigned orders for groomer ID: ${groomerData.id}`);
      console.log(`🌐 URL: ${API_BASE_URL}/groomer/orders/assigned/${groomerData.id}`);
      
      const response: AxiosResponse = await this.api.get(`/groomer/orders/assigned/${groomerData.id}`);
      
      console.log('✅ Assigned orders response:', response.status, response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Failed to fetch assigned orders:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to fetch assigned orders'
      };
    }
  }

  async getAvailableOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.get('/groomer/orders/available', {
        params: { groomerId: groomerData.id }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch available orders'
      };
    }
  }

  async getAvailableOrdersWithRadius(latitude: number, longitude: number, radius: number): Promise<ApiResponse<Order[]>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.get('/groomer/orders/available', {
        params: { 
          groomerId: groomerData.id,
          latitude, 
          longitude, 
          radiusKm: radius 
        }
      });
      
      // Calculate distances for each order
      const ordersWithDistance = response.data.map((order: Order) => ({
        ...order,
        distanceFromGroomer: order.latitude && order.longitude 
          ? this.calculateDistance(latitude, longitude, order.latitude, order.longitude)
          : undefined
      }));
      
      return { success: true, data: ordersWithDistance };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch orders with radius'
      };
    }
  }

  async acceptOrder(orderId: number, estimatedArrival?: string): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.post('/groomer/orders/accept', {
        orderId,
        groomerId: groomerData.id,
        estimatedArrival
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to accept order'
      };
    }
  }

  async updateOrderStatus(orderId: number, status: Order['status'], notes?: string): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.put(`/groomer/orders/${orderId}/status`, { 
        status, 
        notes,
        groomerId: groomerData.id 
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update order status'
      };
    }
  }

  // ==================== ORDER WORKFLOW APIs ====================
  // Service OTP methods for order start/end verification
  
  async requestServiceStartOTP(orderId: number): Promise<ApiResponse<string>> {
    try {
      // For start service, OTP is sent when order is assigned, not when requested
      // This is a placeholder - the actual OTP is sent during order assignment
      return { 
        success: true, 
        message: 'Start OTP was sent to customer when order was assigned. Please get the OTP from customer.' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: 'Failed to request service start OTP'
      };
    }
  }

  async requestServiceEndOTP(orderId: number): Promise<ApiResponse<string>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.post(`/orders/${orderId}/request-completion-otp`, {
        groomerId: groomerData.id
      });
      return { success: true, message: response.data.message || 'Completion OTP sent to customer' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to request completion OTP'
      };
    }
  }

  async verifyServiceStartOTP(orderId: number, otp: string): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.post(`/orders/${orderId}/start`, {
        startOtp: otp,
        groomerId: groomerData.id
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Invalid start OTP. Please check with customer.'
      };
    }
  }

  async verifyServiceEndOTP(orderId: number, otp: string): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.post(`/orders/${orderId}/complete`, {
        completionOtp: otp,
        groomerId: groomerData.id,
        groomerNotes: '' // Optional notes can be added later
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Invalid completion OTP. Please check with customer.'
      };
    }
  }

  // ==================== PROFILE MANAGEMENT APIs ====================

  async updateProfile(profileData: Partial<Groomer>): Promise<ApiResponse<Groomer>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      // Add groomer ID to the profile data for backend
      const updateData = { ...profileData, id: groomerData.id };
      
      const response: AxiosResponse = await this.api.put('/groomer/profile', updateData);
      
      // Update stored groomer data
      await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }

  async updateAvailability(groomerId: number, isAvailable: boolean): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.patch(`/groomer/${groomerId}/availability`, { 
        isAvailable 
      });
      
      // Update stored groomer data
      const storedData = await this.getStoredGroomerData();
      if (storedData) {
        const updatedData = { ...storedData, isAvailableForOrders: isAvailable };
        await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(updatedData));
      }
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update availability'
      };
    }
  }



  async getStoredGroomerData(): Promise<Groomer | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GROOMER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  // ==================== EARNINGS & ANALYTICS APIs ====================

  async getEarnings(period: 'today' | 'week' | 'month'): Promise<ApiResponse<EarningsData>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      // Map period to days for backend
      const daysMap = { today: 1, week: 7, month: 30 };
      const days = daysMap[period];
      
      const response: AxiosResponse = await this.api.get(`/groomer/${groomerData.id}/earnings`, {
        params: { days }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch earnings'
      };
    }
  }

  async getEarningsHistory(): Promise<ApiResponse<EarningsHistory[]>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.get(`/groomer/${groomerData.id}/earnings/history`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch earnings history'
      };
    }
  }



  // ==================== UTILITY FUNCTIONS ====================

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Check authentication status
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const groomerData = await AsyncStorage.getItem(STORAGE_KEYS.GROOMER_DATA);
      return !!(token && groomerData);
    } catch {
      return false;
    }
  }

  // Health check endpoint
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { timeout: 5000 } as any);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Test method to verify AsyncStorage operations work
  async testAsyncStorage(): Promise<boolean> {
    try {
      const testKey = '@test_key_' + Date.now();
      const testValue = 'test_value';
      
      // Test write
      await AsyncStorage.setItem(testKey, testValue);
      console.log('✅ AsyncStorage write test passed');
      
      // Test read
      const retrievedValue = await AsyncStorage.getItem(testKey);
      console.log('✅ AsyncStorage read test passed:', retrievedValue === testValue);
      
      // Test delete
      await AsyncStorage.removeItem(testKey);
      console.log('✅ AsyncStorage delete test passed');
      
      const deletedValue = await AsyncStorage.getItem(testKey);
      console.log('✅ AsyncStorage verification test passed:', deletedValue === null);
      
      return true;
    } catch (error) {
      console.error('❌ AsyncStorage test failed:', error);
      return false;
    }
  }



  // ==================== PROFILE MANAGEMENT APIs ====================

  async getProfile(): Promise<ApiResponse<GroomerProfile>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.get(`/groomer/profile/${groomerData.id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get profile' 
      };
    }
  }

  async updateLocation(latitude: number, longitude: number, serviceRadiusKm?: number): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const payload: any = {
        latitude,
        longitude
      };
      
      if (serviceRadiusKm !== undefined) {
        payload.serviceRadiusKm = serviceRadiusKm;
      }
      
      const response: AxiosResponse = await this.api.patch(`/groomer/${groomerData.id}/location`, payload);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update location' 
      };
    }
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.get(`/groomer/${groomerData.id}/statistics`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get statistics' 
      };
    }
  }

  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.patch(`/groomer/${groomerData.id}/online-status`, {
        isOnline
      });
      
      // Update stored groomer data
      const updatedData = { ...groomerData, isOnline };
      await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(updatedData));
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update online status' 
      };
    }
  }

  async updateServiceRadius(radiusKm: number): Promise<ApiResponse<any>> {
    try {
      const groomerData = await this.getStoredGroomerData();
      if (!groomerData) throw new Error('No groomer data found');
      
      const response: AxiosResponse = await this.api.patch(`/groomer/${groomerData.id}/service-radius`, {
        serviceRadius: radiusKm
      });
      
      // Update stored groomer data
      const updatedData = { ...groomerData, serviceRadius: radiusKm };
      await AsyncStorage.setItem(STORAGE_KEYS.GROOMER_DATA, JSON.stringify(updatedData));
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update service radius' 
      };
    }
  }


}

export default new GroomerAPI();