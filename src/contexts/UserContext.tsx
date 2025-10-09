/**
 * User Context for managing client data and authentication state
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginApi, type Client } from '../api';

interface UserContextType {
  client: Client | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user data on mount
  useEffect(() => {
    initializeUserData();
  }, []);

  const initializeUserData = () => {
    try {
      const clientData = loginApi.getClientData();
      const authenticated = loginApi.isAuthenticated();
      
      setClient(clientData);
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('❌ Failed to initialize user data:', error);
      setClient(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await loginApi.login({ email, password });
      
      setClient(response.client);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      setClient(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await loginApi.logout();
      
      setClient(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Still clear local state even if logout fails
      setClient(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = () => {
    initializeUserData();
  };

  const value: UserContextType = {
    client,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Export types
export type { UserContextType };
