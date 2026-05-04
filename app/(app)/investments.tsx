import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function InvestmentsScreen() {
  const { accounts, investmentTotal, superTotal } = useAccounts();
  const { formatCurrency } = useCurrency();

  const investmentAccounts = accounts.filter(a => a.type === 'investment');
  const superAccounts = accounts.filter(a => a.type === 'super');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Investments</Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Investment Portfolio</Text>
            <Text style={styles.summaryValue}>{formatCurrency(investmentTotal)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Superannuation</Text>
            <Text style={styles.summaryValue}>{formatCurrency(superTotal)}</Text>
          </View>
        </View>

        {/* Investment Accounts */}
        {investmentAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Investment Accounts</Text>
            {investmentAccounts.map(account => (
              <View key={account.id} style={styles.accountRow}>
                <View style={[styles.colorBar, { backgroundColor: account.color }]} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  {account.institution && <Text style={styles.accountInstitution}>{account.institution}</Text>}
                </View>
                <Text style={[styles.accountBalance, { color: account.balance >= 0 ? '#34D399' : '#F87171' }]}>
                  {formatCurrency(account.balance)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Super Accounts */}
        {superAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏗️ Superannuation</Text>
            {superAccounts.map(account => (
              <View key={account.id} style={styles.accountRow}>
                <View style={[styles.colorBar, { backgroundColor: account.color }]} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  {account.institution && <Text style={styles.accountInstitution}>{account.institution}</Text>}
                </View>
                <Text style={styles.accountBalance}>{formatCurrency(account.balance)}</Text>
              </View>
            ))}
            <View style={styles.superNote}>
              <Text style={styles.superNoteText}>
                💡 Super is excluded from accessible net worth as it is a locked retirement asset
              </Text>
            </View>
          </View>
        )}

        {investmentAccounts.length === 0 && superAccounts.length === 0 && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyTitle}>No investment accounts</Text>
            <Text style={styles.emptySubtitle}>
              Add investment or super accounts in the Accounts tab to track your portfolio here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 16 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', marginBottom: 6, textAlign: 'center' },
  summaryValue: { color: '#34D399', fontSize: 20, fontWeight: '800' },
  divider: { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 8 },
  section: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  colorBar: { width: 4, height: 36, borderRadius: 2 },
  accountInfo: { flex: 1 },
  accountName: { color: 'white', fontSize: 14, fontWeight: '600' },
  accountInstitution: { color: '#64748B', fontSize: 12, marginTop: 2 },
  accountBalance: { color: 'white', fontSize: 15, fontWeight: '700' },
  superNote: {
    marginTop: 12, padding: 10,
    backgroundColor: '#0F172A', borderRadius: 8,
  },
  superNoteText: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  emptySection: {
    padding: 40, alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
