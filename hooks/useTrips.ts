import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Trip, TripExpense } from '../lib/types';

function generateId() {
  return crypto.randomUUID();
}

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const tripsRef = useRef<Trip[]>([]);

  useEffect(() => { tripsRef.current = trips; }, [trips]);

  useEffect(() => {
    if (!user) { setTrips([]); setIsLoaded(false); return; }
    const col = collection(db, 'users', user.uid, 'trips');
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snapshot => {
      setTrips(snapshot.docs.map(d => d.data() as Trip));
      setIsLoaded(true);
    }, () => setIsLoaded(true));
    return unsub;
  }, [user]);

  const addTrip = useCallback(async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const trip: Trip = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', user.uid, 'trips', trip.id), trip);
    return trip;
  }, [user]);

  const updateTrip = useCallback(async (id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'trips', id), {
      ...data, updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'trips', id));
  }, [user]);

  const addTripExpense = useCallback(async (tripId: string, expense: TripExpense) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), {
      expenses: arrayUnion(expense), updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const updateTripExpense = useCallback(async (tripId: string, expense: TripExpense) => {
    if (!user) return;
    const trip = tripsRef.current.find(t => t.id === tripId);
    if (!trip) return;
    const updatedExpenses = trip.expenses.map(e => e.id === expense.id ? expense : e);
    await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), {
      expenses: updatedExpenses, updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteTripExpense = useCallback(async (tripId: string, expenseId: string) => {
    if (!user) return;
    const trip = tripsRef.current.find(t => t.id === tripId);
    if (!trip) return;
    const expense = trip.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    await updateDoc(doc(db, 'users', user.uid, 'trips', tripId), {
      expenses: arrayRemove(expense), updatedAt: new Date().toISOString(),
    });
  }, [user]);

  return { trips, isLoaded, addTrip, updateTrip, deleteTrip, addTripExpense, updateTripExpense, deleteTripExpense };
}
