"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface AuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
  status?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "authUser";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthUser;
        setUser(parsed);
      } catch (err) {
        console.error("Failed to parse authUser", err);
      }
    }
    setLoading(false);
  }, []);

  const login = (authUser: AuthUser) => {
    setUser(authUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
