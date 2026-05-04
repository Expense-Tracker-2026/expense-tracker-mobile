import { useState, useMemo } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useIncome } from '../../hooks/useIncome';
import { useCurrency } from '../../contexts/CurrencyContext';
import { IncomeForm } from '../../components/forms/IncomeForm';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { INCOME_CATEGORY_ICONS, getIncomeCategoryConfig } from '../../lib/incomeCategories';
import { formatDate } from '../../lib/utils';
import type { Income, IncomeFormData } from '../../lib/types';

const SORT_OPTIONS = ['Date ↓', 'Date ↑', 'Amount ↓', 'Amount ↑'];

export default function IncomeScreen() {
  const { income, isLoaded, addIncome, updateIncome, deleteIncome } = useIncome();
  const { formatCurrency } = useCurrency();

  const [search, setSearch] = useState('');
  const [sortIdx, setSortIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTotal = income
    .filter(e => e.date.startsWith(monthPrefix))
    .reduce((s, e) => s + e.amount, 0);

  const filtered = useMemo(() => {
    let list = [...income];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.employer ?? '').toLowerCase().includes(q) ||
        (e.tags ?? []).some(t => t.includes(q))
      );
    }
    switch (sortIdx) {
      case 0: list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case 1: list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case 2: list.sort((a, b) => b.amount - a.amount); break;
      case 3: list.sort((a, b) => a.amount - b.amount); break;
    }
    return list;
  }, [income, search, sortIdx]);

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  async function handleSave(data: IncomeFormData) {
    const payload = {
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
    };
    if (editingIncome) {
      await updateIncome(editingIncome.id, payload as any);
    } else {
      await addIncome(payload as any);
    }
  }

  function handleEdit(item: Income) {
    setEditingIncome(item);
    setShowForm(true);
  }

  function handleDelete(item: Income) {
    Alert.alert(
      'Delete Income',
      `Delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteIncome(item.id) },
      ]
    );
  }

  function openAdd() {
    setEditingIncome(null);
    setShowForm(true);
  }

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Income</Text>
          <Text style={styles.headerSub}>This month: {formatCurrency(monthTotal)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Sort */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search income..."
          placeholderTextColor="#475569"
        />
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortIdx((sortIdx + 1) % SORT_OPTIONS.length)}
        >
          <Text style={styles.sortText}>{SORT_OPTIONS[sortIdx]}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="💼"
            title="No income yet"
            subtitle="Tap '+ Add' to record your first income"
            actionTitle="Add Income"
            onAction={openAdd}
          />
        }
        renderItem={({ item }) => {
          const cat = getIncomeCategoryConfig(item.category);
          return (
            <SwipeableRow
              rightActions={[
                { label: 'Edit', color: '#4F46E5', onPress: () => handleEdit(item), icon: '✏️' },
                { label: 'Delete', color: '#DC2626', onPress: () => handleDelete(item), icon: '🗑️' },
              ]}
            >
              <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)} activeOpacity={0.7}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                  <Text style={styles.catIconText}>{INCOME_CATEGORY_ICONS[item.category]}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.cardAmount}>+{formatCurrency(item.amount)}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                    <Badge label={item.category} color={cat.color} />
                    {item.employer && <Text style={styles.employer}>{item.employer}</Text>}
                    {item.grossAmount && <Badge label="PAYG" color="#3B82F6" />}
                    {item.attachment && <Badge label="📎" color="#64748B" />}
                  </View>
                  {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.tags.slice(0, 3).map(tag => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <IncomeForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingIncome(null); }}
        onSave={handleSave}
        initial={editingIncome ? {
          date: editingIncome.date,
          amount: String(editingIncome.amount),
          category: editingIncome.category,
          description: editingIncome.description,
          employer: editingIncome.employer,
          grossAmount: editingIncome.grossAmount ? String(editingIncome.grossAmount) : undefined,
          taxWithheld: editingIncome.taxWithheld ? String(editingIncome.taxWithheld) : undefined,
          superannuation: editingIncome.superannuation ? String(editingIncome.superannuation) : undefined,
          tags: editingIncome.tags ?? [],
          attachment: editingIncome.attachment,
          accountId: editingIncome.accountId,
          memberId: editingIncome.memberId,
        } : undefined}
        incomeId={editingIncome?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sortBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sortText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconText: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardDesc: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  cardAmount: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardDate: {
    color: '#64748B',
    fontSize: 12,
  },
  employer: {
    color: '#64748B',
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#334155',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
