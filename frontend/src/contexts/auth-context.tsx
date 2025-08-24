"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: "admin" | "developer" | "viewer";
  is_active: boolean;
  needs_password_setup: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (userData: RegisterUserData) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

export interface RegisterUserData {
  username: string;
  email?: string;
  full_name: string;
  role: "admin" | "developer" | "viewer";
  is_active?: boolean;
  needs_password_setup?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("auth_token");
        setToken(null);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      localStorage.removeItem("auth_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem("auth_token", data.access_token);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  };

  const registerUser = async (userData: RegisterUserData): Promise<boolean> => {
    if (!token) return false;

    try {
      // Prepare the data for the backend
      const userDataToSend = {
        username: userData.username,
        email: userData.email || null, // Convert empty string to null
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active ?? true,
        needs_password_setup: true, // Always true for new users
      };

      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userDataToSend),
      });

      return response.ok;
    } catch (error) {
      console.error("Register user error:", error);
      return false;
    }
  };

  const refreshUserData = async () => {
    if (token) {
      await fetchUserInfo(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    registerUser,
    refreshUserData,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
