import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB756Tyqaa47OQORTlgXBIDsJRCnp5eyFM',
  authDomain: 'expense-tracker-9e457.firebaseapp.com',
  projectId: 'expense-tracker-9e457',
  storageBucket: 'expense-tracker-9e457.firebasestorage.app',
  messagingSenderId: '958375031325',
  appId: '1:958375031325:web:f182e291c005649d4a4cf4',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
