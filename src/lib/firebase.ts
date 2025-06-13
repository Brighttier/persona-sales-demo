import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Connect to emulators in development (only if explicitly configured)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only connect to emulators if they are explicitly configured
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 
      process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 
      process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
    
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
        connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
        console.log('Connected to Auth emulator');
      }
      
      if (process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST) {
        const [firestoreHost, firestorePort] = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST.split(':');
        connectFirestoreEmulator(db, firestoreHost, parseInt(firestorePort));
        console.log('Connected to Firestore emulator');
      }
      
      if (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST) {
        const [functionsHost, functionsPort] = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST.split(':');
        connectFunctionsEmulator(functions, functionsHost, parseInt(functionsPort));
        console.log('Connected to Functions emulator');
      }
    } catch (error) {
      console.log('Firebase emulators already connected or failed to connect:', error);
    }
  } else {
    console.log('Using production Firebase services');
  }
}

export default app;