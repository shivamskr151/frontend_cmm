/**
 * Optimized Login API Service
 * Handles authentication with the new client login endpoint
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  client: Client;
  access_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginError {
  message: string;
  code?: string;
  details?: any;
}

export class LoginApiService {
  private baseUrl = 'http://localhost:4200';
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  /**
   * Perform login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${this.baseUrl}/client/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status} ${response.statusText}`);
      }

      const data: LoginResponse = await response.json();
      
      // Validate response structure
      if (!data.client || !data.access_token) {
        throw new Error('Invalid response format from server');
      }

      // Store authentication data
      this.storeAuthData(data);
      
      console.log('✅ Login successful for:', data.client.name);
      return data;

    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Login request timed out. Please check your connection and try again.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred during login');
    }
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(data: LoginResponse): void {
    try {
      // Store token
      localStorage.setItem('access_token', data.access_token);
      
      // Store client data
      localStorage.setItem('client_data', JSON.stringify(data.client));
      
      // Store login timestamp for token expiry calculation
      localStorage.setItem('login_timestamp', Date.now().toString());
      
      console.log('💾 Authentication data stored successfully');
    } catch (error) {
      console.error('❌ Failed to store authentication data:', error);
      throw new Error('Failed to save login information');
    }
  }

  /**
   * Get stored client data
   */
  getClientData(): Client | null {
    try {
      const clientData = localStorage.getItem('client_data');
      return clientData ? JSON.parse(clientData) : null;
    } catch (error) {
      console.error('❌ Failed to retrieve client data:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const clientData = this.getClientData();
    
    if (!token || !clientData) {
      return false;
    }

    // Check if token is expired (basic check)
    if (this.isTokenExpired()) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  /**
   * Check if token is expired (basic implementation)
   * In a real app, you'd decode the JWT to check expiry
   */
  private isTokenExpired(): boolean {
    try {
      const loginTimestamp = localStorage.getItem('login_timestamp');
      if (!loginTimestamp) return true;

      const loginTime = parseInt(loginTimestamp);
      const currentTime = Date.now();
      const tokenAge = currentTime - loginTime;
      
      // Assume token expires in 1 hour (3600000 ms)
      // In production, decode JWT to get actual expiry
      const TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour
      
      return tokenAge > TOKEN_LIFETIME;
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('client_data');
      localStorage.removeItem('login_timestamp');
      console.log('🗑️ Authentication data cleared');
    } catch (error) {
      console.error('❌ Failed to clear authentication data:', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // In a real app, you might want to call a logout endpoint
      // to invalidate the token on the server
      console.log('👋 Logging out user');
      this.clearAuthData();
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local data even if server logout fails
      this.clearAuthData();
    }
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' };
    }
    
    return { isValid: true };
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

// Export singleton instance
export const loginApi = new LoginApiService();
