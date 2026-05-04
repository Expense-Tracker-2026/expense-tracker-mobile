import { useState, useMemo } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useBudgets } from '../../hooks/useBudgets';
import { useExpenses } from '../../hooks/useExpenses';
import { useCurrency } from '../../contexts/CurrencyContext';
import { BudgetForm } from '../../components/forms/BudgetForm';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CATEGORY_ICONS, getCategoryConfig } from '../../lib/categories';
import type { Budget } from '../../lib/types';

export default function BudgetsScreen() {
  const { budgets, isLoaded, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { expenses } = useExpenses();
  const { formatCurrency } = useCurrency();

  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter(e => e.date.startsWith(monthPrefix))
      .forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return map;
  }, [expenses, monthPrefix]);

  async function handleSave(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget(data);
    }
  }

  function handleDelete(budget: Budget) {
    Alert.alert('Delete Budget', `Delete budget for "${budget.category}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(budget.id) },
    ]);
  }

  if (!isLoaded) return <LoadingSpinner />;

  const existingCategories = budgets.map(b => b.category);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Budgets</Text>
            <Text style={styles.headerSub}>{now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingBudget(null); setShowForm(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No budgets yet"
            subtitle="Set monthly spending limits per category"
            actionTitle="Add Budget"
            onAction={() => { setEditingBudget(null); setShowForm(true); }}
          />
        ) : (
          budgets.map(budget => {
            const spent = spentByCategory[budget.category] ?? 0;
            const pct = Math.min(100, (spent / budget.monthlyLimit) * 100);
            const isOver = spent > budget.monthlyLimit;
            const isWarning = pct >= 80;
            const cat = getCategoryConfig(budget.category);
            const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

            return (
              <SwipeableRow
                key={budget.id}
                rightActions={[
                  { label: 'Edit', color: '#4F46E5', onPress: () => { setEditingBudget(budget); setShowForm(true); }, icon: '✏️' },
                  { label: 'Delete', color: '#DC2626', onPress: () => handleDelete(budget), icon: '🗑️' },
                ]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => { setEditingBudget(budget); setShowForm(true); }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                      <Text style={styles.catIconText}>{CATEGORY_ICONS[budget.category]}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.catName}>{budget.category}</Text>
                      <Text style={styles.amounts}>
                        {formatCurrency(spent)} / {formatCurrency(budget.monthlyLimit)}
                      </Text>
                    </View>
                    <View style={styles.pctContainer}>
                      <Text style={[styles.pctText, { color: barColor }]}>{Math.round(pct)}%</Text>
                      {isOver && <Text style={styles.overText}>OVER</Text>}
                    </View>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFg, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                  </View>
                  {isOver && (
                    <Text style={styles.overAmount}>
                      Over by {formatCurrency(spent - budget.monthlyLimit)}
                    </Text>
                  )}
                </TouchableOpacity>
              </SwipeableRow>
            );
          })
        )}
      </ScrollView>

      <BudgetForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingBudget(null); }}
        onSave={handleSave}
        initial={editingBudget ?? undefined}
        existingCategories={existingCategories.filter(c => c !== editingBudget?.category)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  headerSub: { color: '#64748B', fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  catIconText: { fontSize: 18 },
  cardInfo: { flex: 1 },
  catName: { color: 'white', fontSize: 15, fontWeight: '600' },
  amounts: { color: '#64748B', fontSize: 12, marginTop: 2 },
  pctContainer: { alignItems: 'flex-end' },
  pctText: { fontSize: 16, fontWeight: '700' },
  overText: { color: '#EF4444', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  barBg: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  barFg: { height: 8, borderRadius: 4 },
  overAmount: { color: '#EF4444', fontSize: 11, marginTop: 6 },
});
