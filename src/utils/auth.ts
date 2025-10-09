import { loginApi, type Client } from '../api';

class AuthService {

  isAuthenticated(): boolean {
    return loginApi.isAuthenticated();
  }
  
  async login(email: string, password: string): Promise<boolean> {
    try {
      // Use the new optimized login API
      const response = await loginApi.login({ email, password });
      
      // Store the token in the old format for backward compatibility
      localStorage.setItem('bearer_token', response.access_token);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Get current client data
   */
  getClientData(): Client | null {
    return loginApi.getClientData();
  }

  /**
   * Get access token (new format)
   */
  getAccessToken(): string | null {
    return loginApi.getAccessToken();
  }
  
  async logout(): Promise<void> {
    try {
      // Use the new logout method
      await loginApi.logout();
      
      // Also clear the old token for backward compatibility
      localStorage.removeItem('bearer_token');
      
      // Navigate to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear data and redirect even if logout fails
      localStorage.removeItem('bearer_token');
      window.location.href = '/login';
    }
  }
  
  getToken(): string | null {
    // Return the new access token if available, otherwise fall back to old token
    return this.getAccessToken() || localStorage.getItem('bearer_token');
  }
  
  setToken(token: string): void {
    localStorage.setItem('bearer_token', token);
    // Also store in the new format
    localStorage.setItem('access_token', token);
  }


}

export const auth = new AuthService();