"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/config/roles';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

// Cookie utility functions
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
  profileComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility function to retry Firestore operations
async function getDocWithRetry(docRef: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getDoc(docRef);
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        try {
          // Get user profile from Firestore with retry logic
          const userDoc = await getDocWithRetry(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              role: userData.role,
              createdAt: userData.createdAt?.toDate(),
              updatedAt: userData.updatedAt?.toDate(),
              profileComplete: userData.profileComplete
            };
            
            setUser(user);
            setRole(user.role);
            
            // Set cookie for middleware
            setCookie('persona-ai-user', JSON.stringify(user));
          } else {
            // User document doesn't exist, create it with default role
            const defaultRole: UserRole = 'candidate';
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              role: defaultRole,
              createdAt: new Date(),
              updatedAt: new Date(),
              profileComplete: false
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newUser,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            setUser(newUser);
            setRole(defaultRole);
            
            // Set cookie for middleware
            setCookie('persona-ai-user', JSON.stringify(newUser));
          }
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          
          // Provide better error messaging for offline scenarios
          if (!isOnline) {
            console.warn('User is offline, unable to fetch profile');
          } else if (error.code === 'unavailable') {
            console.warn('Firebase is temporarily unavailable');
          }
          
          setUser(null);
          setRole(null);
          
          // Clear cookie on error
          deleteCookie('persona-ai-user');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
        
        // Clear cookie when user signs out
        deleteCookie('persona-ai-user');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state and redirection will be handled by onAuthStateChanged
      // No need to manually redirect here as the middleware will handle it
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(result.user, { displayName });
      
      // Create user document in Firestore
      const newUser: User = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileComplete: false
      };
      
      await setDoc(doc(db, 'users', result.user.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      router.push(`/dashboard/${role}/dashboard`);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }, [router]);

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date()
      });
      
      // Update Firebase Auth profile if displayName is being updated
      if (updates.displayName && firebaseUser) {
        await updateProfile(firebaseUser, { displayName: updates.displayName });
      }
      
      // Update local state
      const updatedUser = user ? { ...user, ...updates, updatedAt: new Date() } : null;
      setUser(updatedUser);
      
      // Update cookie with new user data
      if (updatedUser) {
        setCookie('persona-ai-user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }, [user, firebaseUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      role, 
      isLoading, 
      login, 
      register, 
      logout, 
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}