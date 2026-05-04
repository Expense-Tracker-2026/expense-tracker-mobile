import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SavingsGoal } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'savingsGoals');
    const q = query(col, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, snapshot => {
      setGoals(snapshot.docs.map(d => d.data() as SavingsGoal));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addGoal = useCallback(async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const goal: SavingsGoal = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', user.uid, 'savingsGoals', goal.id), goal);
    return goal;
  }, [user]);

  const updateGoal = useCallback(async (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
  }, [user]);

  return { goals, isLoaded, addGoal, updateGoal, deleteGoal };
}
