import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncome } from '../../hooks/useIncome';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { CURRENCIES } from '../../lib/currency';

export default function ToolsScreen() {
  const { expenses } = useExpenses();
  const { income } = useIncome();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const { rates } = useExchangeRate(currency);

  const [convertAmount, setConvertAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState(currency);
  const [toCurrency, setToCurrency] = useState('USD');

  const convertedAmount = (() => {
    if (!rates || !convertAmount) return null;
    const amt = parseFloat(convertAmount);
    if (isNaN(amt)) return null;
    const rate = rates[toCurrency];
    if (!rate) return null;
    return amt * rate;
  })();

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tools</Text>

        {/* Currency Converter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💱 Currency Converter</Text>
          <TextInput
            style={styles.input}
            value={convertAmount}
            onChangeText={setConvertAmount}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor="#475569"
          />
          <View style={styles.currencyRow}>
            <View style={styles.currencySelect}>
              <Text style={styles.currencyLabel}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CURRENCIES.slice(0, 8).map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyChip, fromCurrency === c.code && styles.currencyChipActive]}
                    onPress={() => setFromCurrency(c.code)}
                  >
                    <Text style={[styles.currencyChipText, fromCurrency === c.code && styles.currencyChipTextActive]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.currencyRow}>
            <View style={styles.currencySelect}>
              <Text style={styles.currencyLabel}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CURRENCIES.slice(0, 8).map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyChip, toCurrency === c.code && styles.currencyChipActive]}
                    onPress={() => setToCurrency(c.code)}
                  >
                    <Text style={[styles.currencyChipText, toCurrency === c.code && styles.currencyChipTextActive]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          {convertedAmount != null && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>{convertAmount} {fromCurrency} =</Text>
              <Text style={styles.resultValue}>{convertedAmount.toFixed(2)} {toCurrency}</Text>
            </View>
          )}
        </View>

        {/* Preferred Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Preferred Currency</Text>
          <Text style={styles.sectionSub}>Current: {currency}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                onPress={() => setCurrency(c.code)}
              >
                <Text style={[styles.currencyChipText, currency === c.code && styles.currencyChipTextActive]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Financial Overview</Text>
          {[
            { label: 'Total Income (all time)', value: totalIncome, color: '#34D399' },
            { label: 'Total Expenses (all time)', value: totalExpenses, color: '#F87171' },
            { label: 'Net Balance (all time)', value: netBalance, color: netBalance >= 0 ? '#34D399' : '#F87171' },
            { label: 'Total Transactions', value: expenses.length + income.length, isCount: true },
          ].map(item => (
            <View key={item.label} style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>{item.label}</Text>
              <Text style={[styles.overviewValue, { color: item.color ?? 'white' }]}>
                {item.isCount ? item.value : formatCurrency(item.value as number)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 16 },
  section: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionSub: { color: '#64748B', fontSize: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    padding: 14, color: 'white', fontSize: 16, marginBottom: 12,
  },
  currencyRow: { marginBottom: 8 },
  currencySelect: {},
  currencyLabel: { color: '#64748B', fontSize: 12, marginBottom: 6 },
  currencyScroll: { marginBottom: 4 },
  currencyChip: {
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6,
    backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#334155',
  },
  currencyChipActive: { backgroundColor: '#7C3AED22', borderColor: '#7C3AED' },
  currencyChipText: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  currencyChipTextActive: { color: '#A78BFA', fontWeight: '600' },
  resultBox: {
    marginTop: 12, padding: 16,
    backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#7C3AED',
    alignItems: 'center',
  },
  resultLabel: { color: '#64748B', fontSize: 13 },
  resultValue: { color: '#A78BFA', fontSize: 24, fontWeight: '800', marginTop: 4 },
  overviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  overviewLabel: { color: '#94A3B8', fontSize: 13 },
  overviewValue: { fontSize: 15, fontWeight: '700' },
});
