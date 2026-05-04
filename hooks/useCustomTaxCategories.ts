import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, doc,
  setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { TaxDeductionCategoryDef } from '../lib/taxCategories';

export interface CustomTaxCategory extends TaxDeductionCategoryDef {
  id: string;
  createdAt: string;
}

export function useCustomTaxCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CustomTaxCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setCategories([]); setIsLoaded(false); return; }
    const col = collection(db, 'users', user.uid, 'taxCategories');
    const q = query(col, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => d.data() as CustomTaxCategory));
      setIsLoaded(true);
    }, () => setIsLoaded(true));
    return unsub;
  }, [user]);

  const addCategory = useCallback(async (data: { label: string; code: string; description: string }) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const entry: CustomTaxCategory = {
      id,
      value: data.label,
      label: data.label,
      code: data.code || 'C',
      description: data.description,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid, 'taxCategories', id), entry);
    return entry;
  }, [user]);

  const updateCategory = useCallback(async (id: string, data: { label: string; code: string; description: string }) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'taxCategories', id), {
      id,
      value: data.label,
      label: data.label,
      code: data.code || 'C',
      description: data.description,
      isCustom: true,
      createdAt: categories.find(c => c.id === id)?.createdAt ?? new Date().toISOString(),
    });
  }, [user, categories]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'taxCategories', id));
  }, [user]);

  return { categories, isLoaded, addCategory, updateCategory, deleteCategory };
}
