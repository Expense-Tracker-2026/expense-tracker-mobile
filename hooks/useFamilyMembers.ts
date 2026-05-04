import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { FamilyMember } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useFamilyMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setMembers([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'familyMembers');
    const q = query(col, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, snapshot => {
      setMembers(snapshot.docs.map(d => d.data() as FamilyMember));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addMember = useCallback(async (data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const raw: FamilyMember = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    // Firestore rejects undefined values — strip them before writing
    const member = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined),
    ) as FamilyMember;
    await setDoc(doc(db, 'users', user.uid, 'familyMembers', member.id), member);
    return member;
  }, [user]);

  const updateMember = useCallback(async (id: string, data: Partial<Omit<FamilyMember, 'id' | 'createdAt'>>) => {
    if (!user) return;
    const payload = Object.fromEntries(
      Object.entries({ ...data, updatedAt: new Date().toISOString() }).filter(([, v]) => v !== undefined),
    );
    await updateDoc(doc(db, 'users', user.uid, 'familyMembers', id), payload);
  }, [user]);

  const deleteMember = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'familyMembers', id));
  }, [user]);

  return { members, isLoaded, addMember, updateMember, deleteMember };
}
