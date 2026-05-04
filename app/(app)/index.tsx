import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncome } from '../../hooks/useIncome';
import { useAccounts } from '../../hooks/useAccounts';
import { useBudgets } from '../../hooks/useBudgets';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CategoryDonutChart } from '../../components/charts/CategoryDonutChart';
import { MonthlyBarChart } from '../../components/charts/MonthlyBarChart';
import { ExpenseForm } from '../../components/forms/ExpenseForm';
import { IncomeForm } from '../../components/forms/IncomeForm';
import { CATEGORIES, CATEGORY_ICONS, getCategoryConfig } from '../../lib/categories';
import { getMonthlyGroupedData, getTotalByCategory, formatDate } from '../../lib/utils';
import type { ExpenseFormData, IncomeFormData } from '../../lib/types';
export default function DashboardScreen() {
  const { user } = useAuth();
  const { expenses, addExpense } = useExpenses();
  const { income, addIncome } = useIncome();
  const { accessibleNetWorth, totalWealthInclSuper } = useAccounts();
  const { budgets } = useBudgets();
  const { formatCurrency } = useCurrency();

  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showFab, setShowFab] = useState(false);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.displayName?.split(' ')[0] ?? 'there';
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthPrefix)).reduce((s, e) => s + e.amount, 0);
  const monthIncome = income.filter(e => e.date.startsWith(monthPrefix)).reduce((s, e) => s + e.amount, 0);
  const netBalance = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome) * 100 : 0;

  const monthlyData = getMonthlyGroupedData(expenses, income, 6);

  const catTotals = getTotalByCategory(expenses.filter(e => e.date.startsWith(monthPrefix)));
  const donutData = CATEGORIES
    .filter(c => (catTotals[c.name] ?? 0) > 0)
    .map(c => ({ category: c.name, amount: catTotals[c.name] ?? 0, color: c.color }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Budget alerts
  const alertBudgets = budgets.filter(b => {
    const spent = expenses.filter(e => e.date.startsWith(monthPrefix) && e.category === b.category).reduce((s, e) => s + e.amount, 0);
    return spent / b.monthlyLimit >= 0.8;
  });

  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentIncome = [...income].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  async function handleSaveExpense(data: ExpenseFormData) {
    await addExpense({
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description,
      tags: data.tags,
      attachment: data.attachment,
      accountId: data.accountId,
      isTaxDeductible: data.isTaxDeductible,
      taxDeductionCategory: data.taxDeductionCategory,
      deductiblePercentage: data.deductiblePercentage,
      taxRelatedEmployer: data.taxRelatedEmployer,
      taxDeductionReason: data.taxDeductionReason,
      memberId: data.memberId,
    } as any);
  }

  async function handleSaveIncome(data: IncomeFormData) {
    await addIncome({
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description,
      employer: data.employer,
      grossAmount: data.grossAmount ? parseFloat(data.grossAmount) : undefined,
      taxWithheld: data.taxWithheld ? parseFloat(data.taxWithheld) : undefined,
      superannuation: data.superannuation ? parseFloat(data.superannuation) : undefined,
      tags: data.tags,
      attachment: data.attachment,
      accountId: data.accountId,
      memberId: data.memberId,
    } as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerGrad}>
          <Text style={styles.greeting}>{greeting}, {displayName} 👋</Text>
          <Text style={styles.dateStr}>{dateStr}</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsGrid}>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Month Expenses</Text>
            <Text style={[styles.cardValue, { color: '#F87171' }]}>{formatCurrency(monthExpenses)}</Text>
          </View>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Month Income</Text>
            <Text style={[styles.cardValue, { color: '#34D399' }]}>{formatCurrency(monthIncome)}</Text>
          </View>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Net Balance</Text>
            <Text style={[styles.cardValue, { color: netBalance >= 0 ? '#34D399' : '#F87171' }]}>{formatCurrency(netBalance)}</Text>
          </View>
          <View style={styles.cardItem}>
            <Text style={styles.cardLabel}>Net Worth</Text>
            <Text style={[styles.cardValue, { color: accessibleNetWorth >= 0 ? 'white' : '#F87171' }]}>{formatCurrency(accessibleNetWorth)}</Text>
          </View>
        </View>

        {/* Savings Rate */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Savings Rate</Text>
            <Text style={[styles.sectionValue, { color: savingsRate >= 20 ? '#34D399' : savingsRate >= 0 ? '#F59E0B' : '#F87171' }]}>
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFg, {
              width: `${Math.max(0, Math.min(100, savingsRate))}%` as any,
              backgroundColor: savingsRate >= 20 ? '#10B981' : savingsRate >= 0 ? '#F59E0B' : '#EF4444',
            }]} />
          </View>
        </View>

        {/* Monthly Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 6 Months</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
            <MonthlyBarChart data={monthlyData} />
          </ScrollView>
        </View>

        {/* Category Donut */}
        {donutData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month by Category</Text>
            <View style={styles.donutRow}>
              <CategoryDonutChart data={donutData} total={monthExpenses} size={160} />
              <View style={styles.donutLegend}>
                {donutData.slice(0, 5).map(d => (
                  <View key={d.category} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendText} numberOfLines={1}>{d.category}</Text>
                    <Text style={styles.legendAmt}>{formatCurrency(d.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Budget Alerts */}
        {alertBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Budget Alerts</Text>
            {alertBudgets.map(b => {
              const spent = expenses.filter(e => e.date.startsWith(monthPrefix) && e.category === b.category).reduce((s, e) => s + e.amount, 0);
              const pct = (spent / b.monthlyLimit) * 100;
              return (
                <View key={b.id} style={styles.alertCard}>
                  <Text style={styles.alertIcon}>{CATEGORY_ICONS[b.category]}</Text>
                  <View style={styles.alertBody}>
                    <Text style={styles.alertCat}>{b.category}</Text>
                    <Text style={styles.alertAmt}>{formatCurrency(spent)} / {formatCurrency(b.monthlyLimit)}</Text>
                  </View>
                  <Text style={[styles.alertPct, { color: pct >= 100 ? '#EF4444' : '#F59E0B' }]}>
                    {Math.round(pct)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {recentExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet</Text>
          ) : (
            recentExpenses.map(e => {
              const cat = getCategoryConfig(e.category);
              return (
                <View key={e.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cat.color + '22' }]}>
                    <Text style={styles.txIconText}>{CATEGORY_ICONS[e.category]}</Text>
                  </View>
                  <View style={styles.txBody}>
                    <Text style={styles.txDesc} numberOfLines={1}>{e.description}</Text>
                    <Text style={styles.txDate}>{formatDate(e.date)}</Text>
                  </View>
                  <Text style={styles.txExpAmt}>-{formatCurrency(e.amount)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Income */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Income</Text>
          {recentIncome.length === 0 ? (
            <Text style={styles.emptyText}>No income yet</Text>
          ) : (
            recentIncome.map(inc => (
              <View key={inc.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: '#10B98122' }]}>
                  <Text style={styles.txIconText}>💼</Text>
                </View>
                <View style={styles.txBody}>
                  <Text style={styles.txDesc} numberOfLines={1}>{inc.description}</Text>
                  <Text style={styles.txDate}>{formatDate(inc.date)}</Text>
                </View>
                <Text style={styles.txIncAmt}>+{formatCurrency(inc.amount)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        {showFab && (
          <>
            <TouchableOpacity
              style={[styles.fabAction, { backgroundColor: '#10B981' }]}
              onPress={() => { setShowFab(false); setShowIncomeForm(true); }}
            >
              <Text style={styles.fabActionText}>+ Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabAction, { backgroundColor: '#7C3AED' }]}
              onPress={() => { setShowFab(false); setShowExpenseForm(true); }}
            >
              <Text style={styles.fabActionText}>+ Expense</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.fab} onPress={() => setShowFab(!showFab)}>
          <Text style={styles.fabText}>{showFab ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <ExpenseForm visible={showExpenseForm} onClose={() => setShowExpenseForm(false)} onSave={handleSaveExpense} />
      <IncomeForm visible={showIncomeForm} onClose={() => setShowIncomeForm(false)} onSave={handleSaveIncome} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingBottom: 100 },
  headerGrad: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: 'white' },
  dateStr: { color: '#C4B5FD', fontSize: 13, marginTop: 4 },
  cardsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingTop: 16, gap: 8,
  },
  cardItem: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  cardLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', marginBottom: 6 },
  cardValue: { fontSize: 18, fontWeight: '800' },
  section: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  sectionValue: { fontSize: 18, fontWeight: '800' },
  barBg: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  barFg: { height: 8, borderRadius: 4 },
  chartScroll: { marginHorizontal: -4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend: { flex: 1, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { flex: 1, color: '#94A3B8', fontSize: 11 },
  legendAmt: { color: '#64748B', fontSize: 11 },
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F172A', borderRadius: 10, padding: 10, marginBottom: 6,
    gap: 10,
  },
  alertIcon: { fontSize: 18 },
  alertBody: { flex: 1 },
  alertCat: { color: 'white', fontSize: 13, fontWeight: '600' },
  alertAmt: { color: '#64748B', fontSize: 11 },
  alertPct: { fontSize: 14, fontWeight: '700' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 16 },
  txBody: { flex: 1 },
  txDesc: { color: 'white', fontSize: 13, fontWeight: '500' },
  txDate: { color: '#64748B', fontSize: 11, marginTop: 2 },
  txExpAmt: { color: '#F87171', fontSize: 14, fontWeight: '700' },
  txIncAmt: { color: '#34D399', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  fabContainer: {
    position: 'absolute', bottom: 24, right: 20,
    alignItems: 'flex-end', gap: 8,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 26, fontWeight: '300', marginTop: -2 },
  fabAction: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  fabActionText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
