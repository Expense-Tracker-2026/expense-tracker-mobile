import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Income } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useIncome() {
  const { user } = useAuth();
  const [income, setIncome] = useState<Income[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const incomeRef = useRef<Income[]>([]);

  useEffect(() => {
    incomeRef.current = income;
  }, [income]);

  useEffect(() => {
    if (!user) {
      setIncome([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'income');
    const q = query(col, orderBy('date', 'desc'));

    const unsub = onSnapshot(q, snapshot => {
      setIncome(snapshot.docs.map(d => d.data() as Income));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addIncome = useCallback(async (data: Omit<Income, 'id' | 'createdAt'>) => {
    if (!user) return;
    const entry: Income = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'income', entry.id), entry);
    if (data.accountId) {
      await updateDoc(doc(db, 'users', user.uid, 'accounts', data.accountId), {
        balance: increment(data.amount),
        updatedAt: new Date().toISOString(),
      });
    }
    return entry;
  }, [user]);

  const updateIncome = useCallback(async (id: string, data: Omit<Income, 'id' | 'createdAt'>) => {
    if (!user) return;
    const old = incomeRef.current.find(e => e.id === id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(doc(db, 'users', user.uid, 'income', id), data as any);

    const oldAccountId = old?.accountId;
    const newAccountId = data.accountId;

    if (oldAccountId === newAccountId) {
      if (oldAccountId && old && old.amount !== data.amount) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', oldAccountId), {
          balance: increment(data.amount - old.amount),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      if (oldAccountId && old) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', oldAccountId), {
          balance: increment(-old.amount),
          updatedAt: new Date().toISOString(),
        });
      }
      if (newAccountId) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', newAccountId), {
          balance: increment(data.amount),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [user]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;
    const entry = incomeRef.current.find(e => e.id === id);
    await deleteDoc(doc(db, 'users', user.uid, 'income', id));
    if (entry?.accountId) {
      await updateDoc(doc(db, 'users', user.uid, 'accounts', entry.accountId), {
        balance: increment(-entry.amount),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [user]);

  return { income, isLoaded, addIncome, updateIncome, deleteIncome };
}
