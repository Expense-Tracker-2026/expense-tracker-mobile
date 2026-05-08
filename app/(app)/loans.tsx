import { useState, useMemo } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, ScrollView, Modal, Alert, StyleSheet,
} from 'react-native';
import { useLoans } from '../../hooks/useLoans';
import { useAccounts } from '../../hooks/useAccounts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import type { Loan, LoanType, LoanStatus, LoanPayment } from '../../lib/types';

function generateId() { return crypto.randomUUID(); }

function getRemainingBalance(loan: Loan) {
  const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
  return Math.max(0, loan.principalAmount - paid);
}

function getProgress(loan: Loan) {
  if (loan.principalAmount <= 0) return 100;
  const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
  return Math.min(100, Math.round((paid / loan.principalAmount) * 100));
}

function getDueDays(dueDate?: string) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

// ── Loan Form ─────────────────────────────────────────────

interface LoanFormModal {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editing?: Loan;
  accounts: { id: string; name: string }[];
}

function LoanFormModal({ visible, onClose, onSave, editing, accounts }: LoanFormModal) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<LoanType>(editing?.type ?? 'borrowed');
  const [name, setName] = useState(editing?.name ?? '');
  const [principal, setPrincipal] = useState(editing ? String(editing.principalAmount) : '');
  const [rate, setRate] = useState(editing ? String(editing.interestRate) : '0');
  const [startDate, setStartDate] = useState(editing?.startDate ?? today);
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '');
  const [accountId, setAccountId] = useState(editing?.accountId ?? '');
  const [status, setStatus] = useState<LoanStatus>(editing?.status ?? 'active');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);

  function reset() {
    if (!editing) {
      setType('borrowed'); setName(''); setPrincipal(''); setRate('0');
      setStartDate(today); setDueDate(''); setAccountId(''); setStatus('active'); setNotes('');
    }
    setError('');
  }

  function handleSave() {
    const p = parseFloat(principal);
    if (!name.trim()) { setError('Name is required'); return; }
    if (!principal || isNaN(p) || p <= 0) { setError('Enter a valid amount'); return; }
    onSave({
      type, name: name.trim(), principalAmount: Math.round(p * 100) / 100,
      interestRate: Math.max(0, parseFloat(rate) || 0),
      startDate, dueDate: dueDate || undefined, status,
      payments: editing?.payments ?? [],
      accountId: accountId || undefined, notes: notes.trim() || undefined,
    });
    reset(); onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={s.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>{editing ? 'Edit Loan' : 'Add Loan'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent}>
          {/* Type toggle */}
          <Text style={s.fieldLabel}>Loan Direction</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, type === 'borrowed' && s.toggleBtnRed]}
              onPress={() => setType('borrowed')}
            >
              <Text style={[s.toggleBtnText, type === 'borrowed' && s.toggleBtnTextRed]}>I Borrowed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, type === 'lent' && s.toggleBtnGreen]}
              onPress={() => setType('lent')}
            >
              <Text style={[s.toggleBtnText, type === 'lent' && s.toggleBtnTextGreen]}>I Lent</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.helperText}>
            {type === 'borrowed' ? 'You owe money to someone else.' : 'Someone owes you money.'}
          </Text>

          <Text style={s.fieldLabel}>Person / Entity Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="e.g. John Smith" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Principal Amount</Text>
          <TextInput style={s.input} value={principal} onChangeText={setPrincipal}
            placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Interest Rate (% p.a.) <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={rate} onChangeText={setRate}
            placeholder="0" keyboardType="decimal-pad" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Start Date</Text>
          <TextInput style={s.input} value={startDate} onChangeText={setStartDate}
            placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Due Date <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={dueDate} onChangeText={setDueDate}
            placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />

          {editing && (
            <>
              <Text style={s.fieldLabel}>Status</Text>
              <View style={s.statusRow}>
                {(['active', 'paid_off', 'defaulted'] as LoanStatus[]).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[s.statusBtn, status === st && s.statusBtnActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[s.statusBtnText, status === st && s.statusBtnTextActive]}>
                      {st === 'paid_off' ? 'Paid Off' : st.charAt(0).toUpperCase() + st.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {accounts.length > 0 && (
            <>
              <Text style={s.fieldLabel}>Linked Account <Text style={s.optional}>optional</Text></Text>
              <TouchableOpacity style={s.input} onPress={() => setShowAccounts(!showAccounts)}>
                <Text style={{ color: accountId ? 'white' : '#475569' }}>
                  {accountId ? accounts.find(a => a.id === accountId)?.name ?? 'Select account' : 'No account'}
                </Text>
              </TouchableOpacity>
              {showAccounts && (
                <View style={s.dropdown}>
                  <TouchableOpacity style={s.dropdownItem} onPress={() => { setAccountId(''); setShowAccounts(false); }}>
                    <Text style={s.dropdownText}>No account</Text>
                  </TouchableOpacity>
                  {accounts.map(a => (
                    <TouchableOpacity key={a.id} style={s.dropdownItem}
                      onPress={() => { setAccountId(a.id); setShowAccounts(false); }}>
                      <Text style={[s.dropdownText, accountId === a.id && { color: '#A78BFA' }]}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={s.fieldLabel}>Notes <Text style={s.optional}>optional</Text></Text>
          <TextInput style={[s.input, s.textArea]} value={notes} onChangeText={setNotes}
            placeholder="Any additional details..." placeholderTextColor="#475569" multiline numberOfLines={3} />

          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Payment Form ──────────────────────────────────────────

function PaymentModal({ visible, loan, onClose, onSave }: {
  visible: boolean; loan: Loan | null; onClose: () => void;
  onSave: (loanId: string, payment: LoanPayment) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) { setError('Enter a valid amount'); return; }
    if (!loan) return;
    onSave(loan.id, { id: generateId(), date, amount: Math.round(n * 100) / 100, note: note.trim() || undefined });
    setDate(today); setAmount(''); setNote(''); setError('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.modalTitle}>Add Payment</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.modalSave}>Save</Text></TouchableOpacity>
        </View>
        <View style={s.modalContent}>
          <Text style={s.fieldLabel}>Date</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate}
            placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />
          <Text style={s.fieldLabel}>Amount</Text>
          <TextInput style={s.input} value={amount} onChangeText={t => { setAmount(t); setError(''); }}
            placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#475569" autoFocus />
          <Text style={s.fieldLabel}>Note <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={note} onChangeText={setNote}
            placeholder="e.g. Bank transfer" placeholderTextColor="#475569" />
          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Loan Card ─────────────────────────────────────────────

function LoanCard({ loan, onEdit, onDelete, onPay, onMarkPaidOff, formatCurrency, accountName }: {
  loan: Loan; onEdit: () => void; onDelete: () => void; onPay: () => void;
  onMarkPaidOff: () => void; formatCurrency: (n: number) => string; accountName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const remaining = getRemainingBalance(loan);
  const progress = getProgress(loan);
  const dueDays = getDueDays(loan.dueDate);

  const statusColors: Record<LoanStatus, string> = {
    active: '#60A5FA', paid_off: '#34D399', defaulted: '#F87171',
  };
  const statusLabels: Record<LoanStatus, string> = {
    active: 'Active', paid_off: 'Paid Off', defaulted: 'Defaulted',
  };

  return (
    <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: loan.type === 'borrowed' ? '#F87171' : '#34D399' }]}>
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardName} numberOfLines={1}>{loan.name}</Text>
              <View style={[s.badge, { backgroundColor: (loan.type === 'borrowed' ? '#F87171' : '#34D399') + '22' }]}>
                <Text style={[s.badgeText, { color: loan.type === 'borrowed' ? '#F87171' : '#34D399' }]}>
                  {loan.type === 'borrowed' ? 'I Owe' : 'Owed to Me'}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: statusColors[loan.status] + '22' }]}>
                <Text style={[s.badgeText, { color: statusColors[loan.status] }]}>
                  {statusLabels[loan.status]}
                </Text>
              </View>
            </View>
            {accountName && <Text style={s.cardSub}>{accountName}</Text>}
          </View>
          <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>

        <View style={s.amountRow}>
          <View>
            <Text style={s.amtLabel}>Original</Text>
            <Text style={s.amtValue}>{formatCurrency(loan.principalAmount)}</Text>
          </View>
          <View style={s.divider} />
          <View>
            <Text style={s.amtLabel}>Remaining</Text>
            <Text style={[s.amtValue, { color: remaining > 0 ? 'white' : '#34D399' }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
          {loan.interestRate > 0 && (
            <>
              <View style={s.divider} />
              <View>
                <Text style={s.amtLabel}>Interest</Text>
                <Text style={[s.amtValue, { color: '#A78BFA' }]}>{loan.interestRate}% p.a.</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.progressBg}>
          <View style={[s.progressFg, {
            width: `${progress}%` as any,
            backgroundColor: loan.type === 'borrowed' ? '#F87171' : '#34D399',
          }]} />
        </View>
        <View style={s.progressMeta}>
          <Text style={s.progressLabel}>
            {formatDate(loan.startDate)}
            {loan.dueDate && dueDays !== null && (
              <Text style={{ color: dueDays < 0 ? '#F87171' : dueDays <= 30 ? '#F59E0B' : '#64748B' }}>
                {' · Due '}{formatDate(loan.dueDate)}
              </Text>
            )}
          </Text>
          <Text style={s.progressPct}>{progress}%</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          {loan.payments.length > 0 && (
            <View style={s.paymentsSection}>
              <Text style={s.paymentsTitle}>{loan.payments.length} payment{loan.payments.length !== 1 ? 's' : ''}</Text>
              {[...loan.payments].sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                <View key={p.id} style={s.paymentRow}>
                  <View>
                    <Text style={s.paymentDate}>{formatDate(p.date)}</Text>
                    {p.note && <Text style={s.paymentNote}>{p.note}</Text>}
                  </View>
                  <Text style={s.paymentAmt}>{formatCurrency(p.amount)}</Text>
                </View>
              ))}
            </View>
          )}
          {loan.notes && <Text style={s.notesText}>{loan.notes}</Text>}
          <View style={s.cardActions}>
            {loan.status === 'active' && (
              <>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#4F46E522' }]} onPress={onPay}>
                  <Text style={[s.actionBtnText, { color: '#818CF8' }]}>+ Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#05966922' }]} onPress={onMarkPaidOff}>
                  <Text style={[s.actionBtnText, { color: '#34D399' }]}>✓ Paid Off</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#1E293B' }]} onPress={onEdit}>
              <Text style={[s.actionBtnText, { color: '#94A3B8' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#DC262622' }]} onPress={onDelete}>
              <Text style={[s.actionBtnText, { color: '#F87171' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────

export default function LoansScreen() {
  const { loans, isLoaded, addLoan, updateLoan, deleteLoan, addPayment, markPaidOff } = useLoans();
  const { accounts } = useAccounts();
  const { formatCurrency } = useCurrency();

  const [tab, setTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Loan | undefined>();
  const [payLoan, setPayLoan] = useState<Loan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const accountMap = useMemo(() => {
    const m: Record<string, string> = {};
    accounts.forEach(a => { m[a.id] = a.name; });
    return m;
  }, [accounts]);

  const summary = useMemo(() => {
    const active = loans.filter(l => l.status === 'active');
    const totalBorrowed = active.filter(l => l.type === 'borrowed').reduce((s, l) => s + getRemainingBalance(l), 0);
    const totalLent = active.filter(l => l.type === 'lent').reduce((s, l) => s + getRemainingBalance(l), 0);
    return { totalBorrowed, totalLent, net: totalLent - totalBorrowed };
  }, [loans]);

  const displayed = useMemo(() => loans.filter(l => l.type === tab), [loans, tab]);

  function handleDelete(loan: Loan) {
    Alert.alert('Delete Loan', `Delete loan for "${loan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLoan(loan.id) },
    ]);
  }

  function handleMarkPaidOff(loan: Loan) {
    Alert.alert('Mark Paid Off', `Mark "${loan.name}" as paid off?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => markPaidOff(loan.id) },
    ]);
  }

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Loans</Text>
          <Text style={s.headerSub}>Track money you owe and are owed</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditing(undefined); setShowForm(true); }}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>I Owe</Text>
          <Text style={[s.summaryValue, { color: '#F87171' }]}>{formatCurrency(summary.totalBorrowed)}</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Owed to Me</Text>
          <Text style={[s.summaryValue, { color: '#34D399' }]}>{formatCurrency(summary.totalLent)}</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Net</Text>
          <Text style={[s.summaryValue, { color: summary.net >= 0 ? '#34D399' : '#F87171' }]}>
            {formatCurrency(Math.abs(summary.net))}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['borrowed', 'lent'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'borrowed' ? 'I Owe' : 'Owed to Me'}
              {' '}
              <Text style={s.tabCount}>({loans.filter(l => l.type === t).length})</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        contentContainerStyle={displayed.length === 0 ? s.emptyContainer : s.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }}
        ListEmptyComponent={
          <EmptyState icon="🤝" title={tab === 'borrowed' ? 'No borrowed loans' : 'No lent loans'}
            subtitle="Tap '+ Add' to record a loan"
            actionTitle="Add Loan" onAction={() => { setEditing(undefined); setShowForm(true); }} />
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onEdit={() => { setEditing(item); setShowForm(true); }}
            onDelete={() => handleDelete(item)}
            onPay={() => setPayLoan(item)}
            onMarkPaidOff={() => handleMarkPaidOff(item)}
            formatCurrency={formatCurrency}
            accountName={item.accountId ? accountMap[item.accountId] : undefined}
          />
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => { setEditing(undefined); setShowForm(true); }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <LoanFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined); }}
        onSave={data => {
          if (editing) updateLoan(editing.id, data);
          else addLoan(data);
        }}
        editing={editing}
        accounts={accounts}
      />

      <PaymentModal
        visible={!!payLoan}
        loan={payLoan}
        onClose={() => setPayLoan(null)}
        onSave={addPayment}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '500', marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  tabActive: { backgroundColor: '#7C3AED22', borderColor: '#7C3AED' },
  tabText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#A78BFA' },
  tabCount: { color: '#475569', fontSize: 11, fontWeight: '400' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { color: 'white', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  cardSub: { color: '#64748B', fontSize: 11 },
  badge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  chevron: { color: '#475569', fontSize: 11, marginLeft: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  divider: { width: 1, height: 28, backgroundColor: '#334155' },
  amtLabel: { color: '#64748B', fontSize: 10, marginBottom: 2 },
  amtValue: { color: 'white', fontSize: 13, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFg: { height: 6, borderRadius: 3 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#64748B', fontSize: 11 },
  progressPct: { color: '#64748B', fontSize: 11 },
  paymentsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  paymentsTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  paymentDate: { color: '#64748B', fontSize: 11 },
  paymentNote: { color: '#94A3B8', fontSize: 11, fontStyle: 'italic' },
  paymentAmt: { color: 'white', fontSize: 12, fontWeight: '600' },
  notesText: { color: '#64748B', fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155', flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: '300', marginTop: -2 },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#0F172A' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  modalTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  modalCancel: { color: '#64748B', fontSize: 15 },
  modalSave: { color: '#A78BFA', fontSize: 15, fontWeight: '700' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, gap: 4 },
  fieldLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  optional: { color: '#475569', fontWeight: '400' },
  input: {
    backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    color: 'white', paddingHorizontal: 12, paddingVertical: 12, fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  toggleBtnRed: { backgroundColor: '#F8717122', borderColor: '#F87171' },
  toggleBtnGreen: { backgroundColor: '#34D39922', borderColor: '#34D399' },
  toggleBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  toggleBtnTextRed: { color: '#F87171' },
  toggleBtnTextGreen: { color: '#34D399' },
  helperText: { color: '#475569', fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  statusBtnActive: { backgroundColor: '#7C3AED22', borderColor: '#7C3AED' },
  statusBtnText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  statusBtnTextActive: { color: '#A78BFA' },
  dropdown: {
    backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownText: { color: '#94A3B8', fontSize: 14 },
  errorText: { color: '#F87171', fontSize: 13, marginTop: 8 },
});
