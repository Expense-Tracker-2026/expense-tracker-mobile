import React, { createContext, useContext, useMemo } from 'react';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useUserProfile } from '../hooks/useUserProfile';
import type { FamilyMember, SubscriptionTier } from '../lib/types';

interface FamilyContextValue {
  members: FamilyMember[];
  isLoaded: boolean;
  subscriptionTier: SubscriptionTier;
  isFamilyEnabled: boolean; // true when diamond or platinum
  addMember: (data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FamilyMember | undefined>;
  updateMember: (id: string, data: Partial<Omit<FamilyMember, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMemberName: (memberId: string | undefined) => string;
  getMemberById: (memberId: string | undefined) => FamilyMember | undefined;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { members, isLoaded, addMember, updateMember, deleteMember } = useFamilyMembers();
  const { profile } = useUserProfile();

  const subscriptionTier: SubscriptionTier = profile?.subscriptionTier ?? 'free';
  const isFamilyEnabled = subscriptionTier === 'diamond' || subscriptionTier === 'platinum';

  const getMemberById = useMemo(() => (memberId: string | undefined) => {
    if (!memberId) return undefined;
    return members.find(m => m.id === memberId);
  }, [members]);

  const getMemberName = useMemo(() => (memberId: string | undefined) => {
    if (!memberId) return 'Family';
    const m = members.find(m => m.id === memberId);
    return m?.name ?? 'Unknown';
  }, [members]);

  return (
    <FamilyContext.Provider value={{
      members,
      isLoaded,
      subscriptionTier,
      isFamilyEnabled,
      addMember,
      updateMember,
      deleteMember,
      getMemberName,
      getMemberById,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used inside FamilyProvider');
  return ctx;
}
