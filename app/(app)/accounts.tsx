import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { AccountForm } from '../../components/forms/AccountForm';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Account, AccountType } from '../../lib/types';

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  checking: '🏦', savings: '💰', investment: '📈',
  super: '🏗️', cash: '💵', credit: '💳', loan: '🏠',
};

const ACCOUNT_TYPE_ORDER: AccountType[] = ['checking', 'savings', 'cash', 'credit', 'loan', 'investment', 'super'];

export default function AccountsScreen() {
  const { accounts, isLoaded, addAccount, updateAccount, deleteAccount, accessibleNetWorth, totalWealthInclSuper } = useAccounts();
  const { formatCurrency } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  async function handleSave(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await addAccount(data);
    }
  }

  function handleDelete(account: Account) {
    Alert.alert('Delete Account', `Delete "${account.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(account.id) },
    ]);
  }

  if (!isLoaded) return <LoadingSpinner />;

  const grouped = ACCOUNT_TYPE_ORDER.reduce((acc, type) => {
    const group = accounts.filter(a => a.type === type);
    if (group.length > 0) acc[type] = group;
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accounts</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingAccount(null); setShowForm(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Net Worth summary */}
        <View style={styles.netWorthCard}>
          <View style={styles.nwRow}>
            <View style={styles.nwItem}>
              <Text style={styles.nwLabel}>Accessible Net Worth</Text>
              <Text style={[styles.nwAmount, { color: accessibleNetWorth >= 0 ? '#34D399' : '#F87171' }]}>
                {formatCurrency(accessibleNetWorth)}
              </Text>
            </View>
            <View style={styles.nwDivider} />
            <View style={styles.nwItem}>
              <Text style={styles.nwLabel}>Total Wealth (incl. Super)</Text>
              <Text style={[styles.nwAmount, { color: totalWealthInclSuper >= 0 ? '#34D399' : '#F87171' }]}>
                {formatCurrency(totalWealthInclSuper)}
              </Text>
            </View>
          </View>
        </View>

        {accounts.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No accounts yet"
            subtitle="Add your bank accounts to track your net worth"
            actionTitle="Add Account"
            onAction={() => { setEditingAccount(null); setShowForm(true); }}
          />
        ) : (
          Object.entries(grouped).map(([type, accs]) => (
            <View key={type} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{ACCOUNT_TYPE_ICONS[type as AccountType]}</Text>
                <Text style={styles.sectionTitle}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                <Text style={styles.sectionTotal}>
                  {formatCurrency(accs.reduce((s, a) => s + a.balance, 0))}
                </Text>
              </View>
              {accs.map(account => (
                <SwipeableRow
                  key={account.id}
                  rightActions={[
                    { label: 'Edit', color: '#4F46E5', onPress: () => { setEditingAccount(account); setShowForm(true); }, icon: '✏️' },
                    { label: 'Delete', color: '#DC2626', onPress: () => handleDelete(account), icon: '🗑️' },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.accountCard}
                    onPress={() => { setEditingAccount(account); setShowForm(true); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: account.color }]} />
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      {account.institution && (
                        <Text style={styles.accountInstitution}>{account.institution}</Text>
                      )}
                    </View>
                    <Text style={[
                      styles.accountBalance,
                      { color: account.balance >= 0 ? 'white' : '#F87171' }
                    ]}>
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <AccountForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingAccount(null); }}
        onSave={handleSave}
        initial={editingAccount ?? undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  netWorthCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  nwRow: { flexDirection: 'row', alignItems: 'center' },
  nwItem: { flex: 1, alignItems: 'center' },
  nwLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', textAlign: 'center', marginBottom: 4 },
  nwAmount: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  nwDivider: { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 8 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, paddingHorizontal: 4,
  },
  sectionIcon: { fontSize: 16, marginRight: 6 },
  sectionTitle: { flex: 1, color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotal: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: '#334155',
  },
  colorSwatch: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  accountInfo: { flex: 1 },
  accountName: { color: 'white', fontSize: 15, fontWeight: '600' },
  accountInstitution: { color: '#64748B', fontSize: 12, marginTop: 2 },
  accountBalance: { fontSize: 16, fontWeight: '700' },
});
