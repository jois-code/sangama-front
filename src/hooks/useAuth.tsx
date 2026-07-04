import React, { createContext, useContext, useState, useEffect } from 'react';
import { set } from 'idb-keyval';
import { apiClient } from '../api/client';

interface User {
  id: number;
  email: string;
  srn: string;
  name: string;
  role: string;
  photo?: string;
  semester?: string;
  section?: string;
  program?: string;
  branch?: string;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('user_profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      
      // Self-heal: If the user refreshed or is migrating and has no local profile, fetch it silently once
      if (!user) {
        apiClient.get('/profile/me').then(res => {
          setUser(res.data);
          localStorage.setItem('user_profile', JSON.stringify(res.data));
        }).catch(err => {
          console.error("Failed to recover user profile", err);
          if (err.response?.status === 401) {
            logout();
          }
        });
      }
      
      setIsLoading(false);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user_profile');
      setUser(null);
      setIsLoading(false);
    }
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await apiClient.post('/auth/login/pesu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const new_token = response.data.access_token;
      localStorage.setItem('pesu_pwd', password);
      localStorage.setItem('token', new_token);
      setToken(new_token);

      // Fetch profile and index it immediately
      const profileRes = await apiClient.get('/profile/me', {
        headers: { Authorization: `Bearer ${new_token}` }
      });
      
      setUser(profileRes.data);
      localStorage.setItem('user_profile', JSON.stringify(profileRes.data));

      // Prefetch courses and cache them
      const cacheKey = `courses_cache_v2`;
      apiClient.get('/courses/', {
        headers: { Authorization: `Bearer ${new_token}` }
      }).then(coursesRes => {
        set(cacheKey, coursesRes.data);
      }).catch(err => console.error("Failed to prefetch courses", err));

      // Prefetch club memberships
      apiClient.get('/memberships/my', {
        headers: { Authorization: `Bearer ${new_token}` }
      }).then(res => {
        localStorage.setItem('my_clubs', JSON.stringify(res.data));
      }).catch(err => console.error("Failed to prefetch memberships", err));

    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Make sure the backend is running and seeded.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pesu_pwd');
  };

  const updateUser = React.useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user_profile', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
