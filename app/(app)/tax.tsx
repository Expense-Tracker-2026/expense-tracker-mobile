import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncome } from '../../hooks/useIncome';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useFamily } from '../../contexts/FamilyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  calculateTaxSummary,
  getAllFinancialYears,
  financialYearLabel,
  getCurrentFinancialYear,
} from '../../lib/taxUtils';

export default function TaxScreen() {
  const { expenses, isLoaded: expLoaded } = useExpenses();
  const { income, isLoaded: incLoaded } = useIncome();
  const { formatCurrency } = useCurrency();
  const { isFamilyEnabled, members } = useFamily();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());
  const [showFYPicker, setShowFYPicker] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

  if (!expLoaded || !incLoaded) return <LoadingSpinner />;

  const allFYs = getAllFinancialYears(income, expenses);
  const memberExpenses = selectedMemberId
    ? expenses.filter(e => e.memberId === selectedMemberId)
    : expenses;
  const memberIncome = selectedMemberId
    ? income.filter(i => i.memberId === selectedMemberId)
    : income;

  const summary = calculateTaxSummary(memberIncome, memberExpenses, selectedFY);

  async function exportCSV() {
    const lines = [
      'Category,Code,Count,Total Amount,Deductible Amount',
      ...summary.deductibleByCategory.map(r =>
        `"${r.category}",${r.code},${r.count},${r.totalAmount.toFixed(2)},${r.deductibleAmount.toFixed(2)}`
      ),
      '',
      `Total Deductible,,,,${summary.totalDeductibleExpenses.toFixed(2)}`,
    ];
    const csv = lines.join('\n');
    const path = FileSystem.cacheDirectory + `tax-${selectedFY}.csv`;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Tax Summary' });
    } else {
      Alert.alert('Sharing not available on this device');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tax Summary</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* FY Selector */}
        <TouchableOpacity style={styles.fySelector} onPress={() => setShowFYPicker(!showFYPicker)}>
          <Text style={styles.fySelectorText}>{financialYearLabel(selectedFY)}</Text>
          <Text style={styles.fyChevron}>{showFYPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showFYPicker && (
          <View style={styles.fyDropdown}>
            {allFYs.map(fy => (
              <TouchableOpacity
                key={fy}
                style={[styles.fyOption, fy === selectedFY && styles.fyOptionActive]}
                onPress={() => { setSelectedFY(fy); setShowFYPicker(false); }}
              >
                <Text style={[styles.fyOptionText, fy === selectedFY && styles.fyOptionTextActive]}>
                  {financialYearLabel(fy)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Member tabs */}
        {isFamilyEnabled && members.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberTabs}>
            <TouchableOpacity
              style={[styles.memberTab, !selectedMemberId && styles.memberTabActive]}
              onPress={() => setSelectedMemberId(undefined)}
            >
              <Text style={[styles.memberTabText, !selectedMemberId && styles.memberTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {members.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberTab, selectedMemberId === m.id && styles.memberTabActive]}
                onPress={() => setSelectedMemberId(m.id)}
              >
                <Text style={[styles.memberTabText, selectedMemberId === m.id && styles.memberTabTextActive]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Summary Cards */}
        <View style={styles.cardsGrid}>
          {[
            { label: 'Gross Income', value: summary.grossIncome, color: '#34D399' },
            { label: 'Tax Withheld', value: summary.taxWithheld, color: '#F87171' },
            { label: 'Superannuation', value: summary.superannuation, color: '#60A5FA' },
            { label: 'Total Deductions', value: summary.totalDeductibleExpenses, color: '#A78BFA' },
            { label: 'Other Income', value: summary.otherIncome, color: '#34D399' },
            { label: 'Net Income', value: summary.netIncome, color: 'white' },
          ].map(item => (
            <View key={item.label} style={styles.cardItem}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={[styles.cardValue, { color: item.color }]}>{formatCurrency(item.value)}</Text>
            </View>
          ))}
        </View>

        {/* Monthly Income Breakdown */}
        {summary.incomeByMonth.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Income Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableLabelCol]}>Month</Text>
              <Text style={[styles.tableCell, styles.tableNumCol]}>Gross</Text>
              <Text style={[styles.tableCell, styles.tableNumCol]}>Tax</Text>
              <Text style={[styles.tableCell, styles.tableNumCol]}>Net</Text>
            </View>
            {summary.incomeByMonth.map(row => (
              <View key={row.month} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableLabelCol]}>{row.label}</Text>
                <Text style={[styles.tableCell, styles.tableNumCol, { color: '#34D399' }]}>{formatCurrency(row.gross)}</Text>
                <Text style={[styles.tableCell, styles.tableNumCol, { color: '#F87171' }]}>{formatCurrency(row.taxWithheld)}</Text>
                <Text style={[styles.tableCell, styles.tableNumCol]}>{formatCurrency(row.netPay)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Deductions by ATO Category */}
        {summary.deductibleByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deductions by ATO Category</Text>
            {summary.deductibleByCategory.map(row => {
              const pct = summary.totalDeductibleExpenses > 0
                ? (row.deductibleAmount / summary.totalDeductibleExpenses) * 100
                : 0;
              return (
                <View key={row.category} style={styles.deductionRow}>
                  <View style={styles.deductionInfo}>
                    <View style={styles.deductionHeader}>
                      <Text style={styles.deductionCat} numberOfLines={1}>{row.category}</Text>
                      <Text style={styles.deductionCode}>{row.code}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFg, { width: `${pct}%` as any }]} />
                    </View>
                    <View style={styles.deductionMeta}>
                      <Text style={styles.deductionCount}>{row.count} item{row.count !== 1 ? 's' : ''}</Text>
                      <Text style={styles.deductionAmt}>{formatCurrency(row.deductibleAmount)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deductions</Text>
              <Text style={styles.totalValue}>{formatCurrency(summary.totalDeductibleExpenses)}</Text>
            </View>
          </View>
        )}

        {summary.deductibleByCategory.length === 0 && summary.incomeByMonth.length === 0 && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tax data for {financialYearLabel(selectedFY)}</Text>
            <Text style={styles.emptySubtitle}>Add income with PAYG details and mark expenses as tax deductible to see your summary</Text>
          </View>
        )}
      </ScrollView>
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
  exportBtn: { backgroundColor: '#334155', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  exportBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  fySelector: {
    marginHorizontal: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 14,
  },
  fySelectorText: { color: 'white', fontSize: 15, fontWeight: '600' },
  fyChevron: { color: '#64748B', fontSize: 12 },
  fyDropdown: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    overflow: 'hidden',
  },
  fyOption: { paddingVertical: 12, paddingHorizontal: 14 },
  fyOptionActive: { backgroundColor: '#7C3AED22' },
  fyOptionText: { color: '#94A3B8', fontSize: 14 },
  fyOptionTextActive: { color: '#A78BFA', fontWeight: '600' },
  memberTabs: { paddingHorizontal: 12, marginBottom: 12 },
  memberTab: {
    paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B',
  },
  memberTabActive: { backgroundColor: '#7C3AED22', borderColor: '#7C3AED' },
  memberTabText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  memberTabTextActive: { color: '#A78BFA', fontWeight: '600' },
  cardsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 8,
  },
  cardItem: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  cardLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', marginBottom: 6 },
  cardValue: { fontSize: 16, fontWeight: '800', color: 'white' },
  section: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tableHeader: {
    flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  tableCell: { color: '#94A3B8', fontSize: 12 },
  tableLabelCol: { flex: 1.5 },
  tableNumCol: { flex: 1, textAlign: 'right' },
  deductionRow: { marginBottom: 12 },
  deductionInfo: {},
  deductionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  deductionCat: { flex: 1, color: 'white', fontSize: 13, fontWeight: '600' },
  deductionCode: { color: '#64748B', fontSize: 11 },
  barBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFg: { height: 6, borderRadius: 3, backgroundColor: '#7C3AED' },
  deductionMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  deductionCount: { color: '#64748B', fontSize: 11 },
  deductionAmt: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155', marginTop: 4,
  },
  totalLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  totalValue: { color: '#A78BFA', fontSize: 16, fontWeight: '800' },
  emptySection: {
    margin: 16, padding: 32,
    backgroundColor: '#1E293B', borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
