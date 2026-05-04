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
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Account } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setIsLoaded(false);
      return;
    }

    const col = collection(db, 'users', user.uid, 'accounts');
    const q = query(col, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, snapshot => {
      setAccounts(snapshot.docs.map(d => d.data() as Account));
      setIsLoaded(true);
    }, () => {
      setIsLoaded(true);
    });

    return unsub;
  }, [user]);

  const addAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const account: Account = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', user.uid, 'accounts', account.id), account);
    return account;
  }, [user]);

  const updateAccount = useCallback(async (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'accounts', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
  }, [user]);

  const adjustBalance = useCallback(async (accountId: string, delta: number) => {
    if (!user || !accountId || delta === 0 || isNaN(delta) || !isFinite(delta)) return;
    await updateDoc(doc(db, 'users', user.uid, 'accounts', accountId), {
      balance: increment(delta),
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const totalAssets = accounts
    .filter(a => a.type !== 'credit' && a.type !== 'loan')
    .reduce((s, a) => s + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'credit' || a.type === 'loan')
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  // Super is an illiquid retirement asset — separated from accessible wealth
  const superTotal = accounts
    .filter(a => a.type === 'super')
    .reduce((s, a) => s + a.balance, 0);

  const investmentTotal = accounts
    .filter(a => a.type === 'investment')
    .reduce((s, a) => s + a.balance, 0);

  // Net worth accessible today (excludes locked super)
  const accessibleNetWorth = totalAssets - superTotal - totalLiabilities;

  // Total wealth including super
  const totalWealthInclSuper = totalAssets - totalLiabilities;

  // Legacy alias kept for backward compat — equals accessible net worth
  const netWorth = accessibleNetWorth;

  return {
    accounts, isLoaded, addAccount, updateAccount, deleteAccount, adjustBalance,
    totalAssets, totalLiabilities, netWorth,
    superTotal, investmentTotal, accessibleNetWorth, totalWealthInclSuper,
  };
}
