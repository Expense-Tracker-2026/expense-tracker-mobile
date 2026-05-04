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
import type { Budget } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'budgets');
    const q = query(col, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, snapshot => {
      setBudgets(snapshot.docs.map(d => d.data() as Budget));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addBudget = useCallback(async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const budget: Budget = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', user.uid, 'budgets', budget.id), budget);
    return budget;
  }, [user]);

  const updateBudget = useCallback(async (id: string, data: Partial<Omit<Budget, 'id' | 'createdAt'>>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'budgets', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
  }, [user]);

  return { budgets, isLoaded, addBudget, updateBudget, deleteBudget };
}
