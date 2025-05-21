"use client";

import type { User, UserRole} from '@/config/roles';
import { DEMO_USERS, USER_ROLES } from '@/config/roles';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'talentverse-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((selectedRole: UserRole) => {
    const demoUser = DEMO_USERS[selectedRole];
    if (demoUser) {
      setUser(demoUser);
      setRole(demoUser.role);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
      router.push(`/dashboard/${demoUser.role}/dashboard`);
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
