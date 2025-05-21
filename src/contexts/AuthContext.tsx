
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

const LOCAL_STORAGE_KEY = 'persona-ai-user';
const COOKIE_KEY = 'persona-ai-user'; // Same key for cookie, used by middleware

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // setIsLoading(true); // Initial state is already true
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
        // Sync cookie: if user found in localStorage, ensure cookie is set for middleware
        const userJson = JSON.stringify(parsedUser);
        document.cookie = `${COOKIE_KEY}=${encodeURIComponent(userJson)}; path=/; max-age=${60 * 60 * 24 * 7}`; // Expires in 7 days
      } else {
        // No user in localStorage, ensure cookie is also cleared for consistency
        document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`; // Expire cookie
      }
    } catch (error) {
      console.error("Failed to load user from localStorage or sync cookie", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`; // Clear potentially problematic cookie
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  const login = useCallback((selectedRole: UserRole) => {
    const demoUser = DEMO_USERS[selectedRole];
    if (demoUser) {
      setUser(demoUser);
      setRole(demoUser.role);
      const userJson = JSON.stringify(demoUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, userJson);
      // Set cookie for middleware
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(userJson)}; path=/; max-age=${60 * 60 * 24 * 7}`; // Expires in 7 days
      router.push(`/dashboard/${demoUser.role}/dashboard`);
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Clear cookie for middleware
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`; // Expire cookie
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
