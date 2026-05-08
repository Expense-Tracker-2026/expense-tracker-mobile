import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Loan, LoanPayment } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoans([]); setIsLoaded(false); return; }
    const col = collection(db, 'users', user.uid, 'loans');
    const q = query(col, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snapshot => {
      setLoans(snapshot.docs.map(d => d.data() as Loan));
      setIsLoaded(true);
    }, () => setIsLoaded(true));
    return unsub;
  }, [user]);

  const addLoan = useCallback(async (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const loan: Loan = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', user.uid, 'loans', loan.id), loan);
    return loan;
  }, [user]);

  const updateLoan = useCallback(async (id: string, data: Partial<Omit<Loan, 'id' | 'createdAt'>>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'loans', id), {
      ...data, updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteLoan = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'loans', id));
  }, [user]);

  const addPayment = useCallback(async (loanId: string, payment: LoanPayment) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'loans', loanId), {
      payments: arrayUnion(payment), updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const markPaidOff = useCallback(async (loanId: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'loans', loanId), {
      status: 'paid_off', updatedAt: new Date().toISOString(),
    });
  }, [user]);

  return { loans, isLoaded, addLoan, updateLoan, deleteLoan, addPayment, markPaidOff };
}
