import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, buildApiUrl } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { useLocation } from 'wouter';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  institution?: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  interface SessionResponse {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
      credits: number;
    }
  }
  
  // Fetch current session
  const { data: sessionData, isLoading: sessionLoading, refetch } = useQuery<SessionResponse>({
    queryKey: ['/api/auth/session'],
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: true,
    enabled: true
  });
  
  // Handle loading state
  useEffect(() => {
    if (!sessionLoading) {
      setIsLoading(false);
    }
  }, [sessionLoading]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const response = await fetch(buildApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Login failed';
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            // If error text is not valid JSON, use it directly
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      await refetch();
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.username}!`,
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      try {
        const response = await fetch(buildApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Registration failed';
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            // If error text is not valid JSON, use it directly
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      await refetch();
      toast({
        title: 'Registration successful',
        description: `Welcome, ${data.user.username}!`,
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(buildApiUrl('/api/auth/logout'), {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Logout failed';
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            // If error text is not valid JSON, use it directly
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.resetQueries();
      toast({
        title: 'Logout successful',
        description: 'You have been logged out',
      });
      setLocation('/login');
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Helper function to check if user is authenticated
  const isAuthenticated = sessionData ? !!sessionData.user : false;

  // Helper function to check if user is admin
  const isAdmin = isAuthenticated && sessionData && sessionData.user && sessionData.user.role === 'admin';

  // Current user data
  const user = sessionData && sessionData.user ? sessionData.user : null;

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading: isLoading || sessionLoading,
    login: (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    register: (credentials: RegisterCredentials) => registerMutation.mutate(credentials),
    logout: () => logoutMutation.mutate(),
    loginIsLoading: loginMutation.isPending,
    registerIsLoading: registerMutation.isPending,
    logoutIsLoading: logoutMutation.isPending,
  };
}
