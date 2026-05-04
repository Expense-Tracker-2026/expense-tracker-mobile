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
import type { Expense } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const expensesRef = useRef<Expense[]>([]);

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'expenses');
    const q = query(col, orderBy('date', 'desc'));

    const unsub = onSnapshot(q, snapshot => {
      setExpenses(snapshot.docs.map(d => d.data() as Expense));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;
    const expense: Expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'expenses', expense.id), expense);
    if (data.accountId) {
      await updateDoc(doc(db, 'users', user.uid, 'accounts', data.accountId), {
        balance: increment(-data.amount),
        updatedAt: new Date().toISOString(),
      });
    }
    return expense;
  }, [user]);

  const updateExpense = useCallback(async (id: string, data: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;
    const old = expensesRef.current.find(e => e.id === id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(doc(db, 'users', user.uid, 'expenses', id), data as any);

    const oldAccountId = old?.accountId;
    const newAccountId = data.accountId;

    if (oldAccountId === newAccountId) {
      if (oldAccountId && old && old.amount !== data.amount) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', oldAccountId), {
          balance: increment(old.amount - data.amount),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      if (oldAccountId && old) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', oldAccountId), {
          balance: increment(old.amount),
          updatedAt: new Date().toISOString(),
        });
      }
      if (newAccountId) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', newAccountId), {
          balance: increment(-data.amount),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;
    const expense = expensesRef.current.find(e => e.id === id);
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    if (expense?.accountId) {
      await updateDoc(doc(db, 'users', user.uid, 'accounts', expense.accountId), {
        balance: increment(expense.amount),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [user]);

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense };
}
