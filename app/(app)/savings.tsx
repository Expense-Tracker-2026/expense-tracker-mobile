import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SavingsGoalForm } from '../../components/forms/SavingsGoalForm';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import type { SavingsGoal } from '../../lib/types';

export default function SavingsScreen() {
  const { goals, isLoaded, addGoal, updateGoal, deleteGoal } = useSavingsGoals();
  const { formatCurrency } = useCurrency();

  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  async function handleSave(data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await addGoal(data);
    }
  }

  function handleDelete(goal: SavingsGoal) {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  }

  if (!isLoaded) return <LoadingSpinner />;

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Savings Goals</Text>
            {goals.length > 0 && (
              <Text style={styles.headerSub}>{formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingGoal(null); setShowForm(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <EmptyState
            icon="🏦"
            title="No savings goals yet"
            subtitle="Set up savings goals to track your progress"
            actionTitle="Add Goal"
            onAction={() => { setEditingGoal(null); setShowForm(true); }}
          />
        ) : (
          goals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <SwipeableRow
                key={goal.id}
                rightActions={[
                  { label: 'Edit', color: '#4F46E5', onPress: () => { setEditingGoal(goal); setShowForm(true); }, icon: '✏️' },
                  { label: 'Delete', color: '#DC2626', onPress: () => handleDelete(goal), icon: '🗑️' },
                ]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => { setEditingGoal(goal); setShowForm(true); }}
                  activeOpacity={0.8}
                >
                  {/* Color bar */}
                  <View style={[styles.goalColorBar, { backgroundColor: goal.color }]} />

                  <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      {isComplete && <Text style={styles.completeBadge}>✓ Complete</Text>}
                    </View>

                    <View style={styles.amountsRow}>
                      <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
                      <Text style={styles.targetAmount}>/ {formatCurrency(goal.targetAmount)}</Text>
                    </View>

                    <View style={styles.barBg}>
                      <View style={[styles.barFg, { width: `${pct}%` as any, backgroundColor: goal.color }]} />
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.pctText}>{Math.round(pct)}% saved</Text>
                      {!isComplete && <Text style={styles.remainText}>{formatCurrency(remaining)} to go</Text>}
                      {goal.deadline && <Text style={styles.deadline}>📅 {formatDate(goal.deadline)}</Text>}
                    </View>

                    {goal.notes && <Text style={styles.notes} numberOfLines={1}>{goal.notes}</Text>}
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          })
        )}
      </ScrollView>

      <SavingsGoalForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingGoal(null); }}
        onSave={handleSave}
        initial={editingGoal ?? undefined}
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
    flexDirection: 'row',
    backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155', overflow: 'hidden',
  },
  goalColorBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  goalName: { flex: 1, color: 'white', fontSize: 16, fontWeight: '700' },
  completeBadge: { color: '#34D399', fontSize: 12, fontWeight: '600' },
  amountsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  currentAmount: { color: 'white', fontSize: 20, fontWeight: '800' },
  targetAmount: { color: '#64748B', fontSize: 14 },
  barBg: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFg: { height: 8, borderRadius: 4 },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pctText: { color: '#94A3B8', fontSize: 12 },
  remainText: { color: '#94A3B8', fontSize: 12 },
  deadline: { color: '#94A3B8', fontSize: 12 },
  notes: { color: '#64748B', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
});
