import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SubscriptionTier } from '../lib/types';

export interface UserProfile {
  displayName: string;
  phone?: string;
  occupation?: string;
  dateOfBirth?: string;
  country: string;
  bio?: string;
  avatarColor: string;
  welcomeSeen?: boolean;
  subscriptionTier?: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_COLORS = [
  '#7C3AED', '#4F46E5', '#0891B2', '#059669',
  '#D97706', '#DC2626', '#DB2777', '#7C3AED',
];

function randomColor() {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoaded(false);
      return;
    }

    const profileRef = doc(db, 'users', user.uid);
    let initialised = false;

    const unsub = onSnapshot(profileRef, snap => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else if (!initialised) {
        const defaultProfile: UserProfile = {
          displayName: user.displayName ?? '',
          phone: '',
          occupation: '',
          dateOfBirth: '',
          country: 'Australia',
          bio: '',
          avatarColor: randomColor(),
          welcomeSeen: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDoc(profileRef, defaultProfile).catch(() => {});
        setProfile(defaultProfile);
        setIsNewUser(true);
      }
      initialised = true;
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const saveProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'createdAt'>>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const payload = { ...updates, updatedAt: new Date().toISOString() };
    await updateDoc(profileRef, payload);
    setProfile(prev => prev ? { ...prev, ...payload } : null);
  }, [user]);

  return { profile, isLoaded, isNewUser, saveProfile };
}
