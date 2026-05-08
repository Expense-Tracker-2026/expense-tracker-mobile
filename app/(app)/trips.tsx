import { useState, useMemo } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, ScrollView, Modal, Alert, StyleSheet,
} from 'react-native';
import { useTrips } from '../../hooks/useTrips';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { CURRENCIES } from '../../lib/currency';
import type { Trip, TripExpense, TripExpenseCategory, TripStatus } from '../../lib/types';

function generateId() { return crypto.randomUUID(); }

const TRIP_EXPENSE_CATEGORIES: TripExpenseCategory[] = [
  'Accommodation', 'Flights', 'Transport', 'Food & Dining',
  'Activities', 'Shopping', 'Insurance', 'Visa & Fees', 'Other',
];

const COVER_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#64748B'];

const CATEGORY_ICONS: Record<TripExpenseCategory, string> = {
  Accommodation: '🏨', Flights: '✈️', Transport: '🚗', 'Food & Dining': '🍽️',
  Activities: '🎯', Shopping: '🛍️', Insurance: '🛡️', 'Visa & Fees': '📋', Other: '📦',
};

function fmt(amount: number, currencyCode: string) {
  const sym = CURRENCIES.find(c => c.code === currencyCode)?.symbol ?? currencyCode;
  return `${sym}${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tripDays(startDate: string, endDate: string) {
  const diff = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function statusLabel(s: TripStatus) {
  return s === 'planning' ? 'Planning' : s === 'ongoing' ? 'Ongoing' : 'Completed';
}

function statusColor(s: TripStatus) {
  return s === 'planning' ? '#60A5FA' : s === 'ongoing' ? '#34D399' : '#94A3B8';
}

// ── Trip Form ──────────────────────────────────────────────

function TripFormModal({ visible, onClose, onSave, editing }: {
  visible: boolean; onClose: () => void;
  onSave: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'expenses'>) => void;
  editing?: Trip;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [destination, setDestination] = useState(editing?.destination ?? '');
  const [startDate, setStartDate] = useState(editing?.startDate ?? '');
  const [endDate, setEndDate] = useState(editing?.endDate ?? '');
  const [currency, setCurrency] = useState(editing?.currency ?? 'USD');
  const [budget, setBudget] = useState(editing ? String(editing.totalBudget) : '');
  const [status, setStatus] = useState<TripStatus>(editing?.status ?? 'planning');
  const [coverColor, setCoverColor] = useState(editing?.coverColor ?? '#6366F1');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState('');
  const [showCurrency, setShowCurrency] = useState(false);

  const commonCurrencies = CURRENCIES.slice(0, 12);

  function reset() {
    if (!editing) {
      setName(''); setDestination(''); setStartDate(''); setEndDate('');
      setCurrency('USD'); setBudget(''); setStatus('planning'); setCoverColor('#6366F1'); setNotes('');
    }
    setError('');
  }

  function handleSave() {
    if (!name.trim()) { setError('Trip name is required'); return; }
    if (!destination.trim()) { setError('Destination is required'); return; }
    if (!startDate) { setError('Start date is required'); return; }
    if (!endDate) { setError('End date is required'); return; }
    if (endDate < startDate) { setError('End date must be after start date'); return; }
    const b = parseFloat(budget);
    if (budget && (isNaN(b) || b < 0)) { setError('Enter a valid budget'); return; }
    onSave({
      name: name.trim(), destination: destination.trim(), startDate, endDate,
      currency, totalBudget: budget ? Math.round(b * 100) / 100 : 0,
      status, coverColor, notes: notes.trim() || undefined,
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
          <Text style={s.modalTitle}>{editing ? 'Edit Trip' : 'New Trip'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent}>
          {/* Color picker */}
          <Text style={s.fieldLabel}>Color</Text>
          <View style={s.colorRow}>
            {COVER_COLORS.map(c => (
              <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, coverColor === c && s.colorDotSelected]}
                onPress={() => setCoverColor(c)} />
            ))}
          </View>

          <Text style={s.fieldLabel}>Trip Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="e.g. Paris 2026" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Destination</Text>
          <TextInput style={s.input} value={destination} onChangeText={setDestination}
            placeholder="e.g. Paris, France" placeholderTextColor="#475569" />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Start Date</Text>
              <TextInput style={s.input} value={startDate} onChangeText={setStartDate}
                placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>End Date</Text>
              <TextInput style={s.input} value={endDate} onChangeText={setEndDate}
                placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />
            </View>
          </View>

          <Text style={s.fieldLabel}>Currency</Text>
          <TouchableOpacity style={s.input} onPress={() => setShowCurrency(!showCurrency)}>
            <Text style={{ color: 'white' }}>
              {CURRENCIES.find(c => c.code === currency)?.name ?? currency} ({currency})
            </Text>
          </TouchableOpacity>
          {showCurrency && (
            <View style={s.dropdown}>
              {commonCurrencies.map(c => (
                <TouchableOpacity key={c.code} style={s.dropdownItem}
                  onPress={() => { setCurrency(c.code); setShowCurrency(false); }}>
                  <Text style={[s.dropdownText, currency === c.code && { color: '#A78BFA' }]}>
                    {c.symbol} {c.name} ({c.code})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={s.fieldLabel}>Total Budget <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={budget} onChangeText={setBudget}
            placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#475569" />

          <Text style={s.fieldLabel}>Status</Text>
          <View style={s.statusRow}>
            {(['planning', 'ongoing', 'completed'] as TripStatus[]).map(st => (
              <TouchableOpacity key={st} style={[s.statusBtn, status === st && s.statusBtnActive]}
                onPress={() => setStatus(st)}>
                <Text style={[s.statusBtnText, status === st && { color: statusColor(st) }]}>
                  {statusLabel(st)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Notes <Text style={s.optional}>optional</Text></Text>
          <TextInput style={[s.input, s.textArea]} value={notes} onChangeText={setNotes}
            placeholder="Any notes..." placeholderTextColor="#475569" multiline numberOfLines={3} />

          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Trip Expense Form ──────────────────────────────────────

function TripExpenseModal({ visible, onClose, onSave, editing, currency }: {
  visible: boolean; onClose: () => void;
  onSave: (data: TripExpense) => void;
  editing?: TripExpense; currency: string;
}) {
  const [category, setCategory] = useState<TripExpenseCategory>(editing?.category ?? 'Other');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [planned, setPlanned] = useState(editing ? String(editing.plannedAmount) : '');
  const [actual, setActual] = useState(editing?.actualAmount !== undefined ? String(editing.actualAmount) : '');
  const [date, setDate] = useState(editing?.date ?? '');
  const [paid, setPaid] = useState(editing?.paid ?? false);
  const [error, setError] = useState('');
  const [showCats, setShowCats] = useState(false);

  function reset() {
    if (!editing) {
      setCategory('Other'); setDescription(''); setPlanned(''); setActual(''); setDate(''); setPaid(false);
    }
    setError('');
  }

  function handleSave() {
    if (!description.trim()) { setError('Description is required'); return; }
    const p = parseFloat(planned);
    if (!planned || isNaN(p) || p < 0) { setError('Enter a valid planned amount'); return; }
    const a = actual ? parseFloat(actual) : undefined;
    onSave({
      id: editing?.id ?? generateId(), category, description: description.trim(),
      plannedAmount: Math.round(p * 100) / 100,
      actualAmount: a !== undefined ? Math.round(a * 100) / 100 : undefined,
      date: date || undefined, paid,
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
          <Text style={s.modalTitle}>{editing ? 'Edit Item' : 'Add Item'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.modalScroll} contentContainerStyle={s.modalContent}>
          <Text style={s.fieldLabel}>Category</Text>
          <TouchableOpacity style={s.input} onPress={() => setShowCats(!showCats)}>
            <Text style={{ color: 'white' }}>{CATEGORY_ICONS[category]} {category}</Text>
          </TouchableOpacity>
          {showCats && (
            <View style={s.dropdown}>
              {TRIP_EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={s.dropdownItem}
                  onPress={() => { setCategory(c); setShowCats(false); }}>
                  <Text style={[s.dropdownText, category === c && { color: '#A78BFA' }]}>
                    {CATEGORY_ICONS[c]} {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={s.fieldLabel}>Description</Text>
          <TextInput style={s.input} value={description} onChangeText={setDescription}
            placeholder="e.g. Hotel booking" placeholderTextColor="#475569" />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Planned ({currency})</Text>
              <TextInput style={s.input} value={planned} onChangeText={setPlanned}
                placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Actual ({currency}) <Text style={s.optional}>opt</Text></Text>
              <TextInput style={s.input} value={actual} onChangeText={setActual}
                placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#475569" />
            </View>
          </View>

          <Text style={s.fieldLabel}>Date <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={date} onChangeText={setDate}
            placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />

          <TouchableOpacity style={s.paidToggle} onPress={() => setPaid(p => !p)}>
            <View style={[s.checkbox, paid && s.checkboxChecked]}>
              {paid && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.paidLabel}>Paid</Text>
          </TouchableOpacity>

          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Trip Detail Screen ─────────────────────────────────────

function TripDetailScreen({ trip, onBack, onEdit, onAddExpense, onEditExpense, onDeleteExpense }: {
  trip: Trip; onBack: () => void; onEdit: () => void;
  onAddExpense: () => void;
  onEditExpense: (e: TripExpense) => void;
  onDeleteExpense: (id: string) => void;
}) {
  const totalPlanned = trip.expenses.reduce((s, e) => s + e.plannedAmount, 0);
  const totalActual = trip.expenses.reduce((s, e) => s + (e.actualAmount ?? 0), 0);
  const paidCount = trip.expenses.filter(e => e.paid).length;
  const days = tripDays(trip.startDate, trip.endDate);
  const budgetUsed = trip.totalBudget > 0 ? Math.min(100, Math.round((totalPlanned / trip.totalBudget) * 100)) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    trip.expenses.forEach(e => {
      map[e.category] = (map[e.category] ?? 0) + e.plannedAmount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [trip.expenses]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={s.editBtn}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover card */}
        <View style={[s.coverCard, { backgroundColor: trip.coverColor + '22', borderColor: trip.coverColor + '44' }]}>
          <View style={s.coverTop}>
            <View>
              <Text style={s.tripName}>{trip.name}</Text>
              <Text style={s.tripDestination}>📍 {trip.destination}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusColor(trip.status) + '22' }]}>
              <Text style={[s.statusPillText, { color: statusColor(trip.status) }]}>{statusLabel(trip.status)}</Text>
            </View>
          </View>
          <Text style={s.tripDates}>
            {trip.startDate} → {trip.endDate} · {days} day{days !== 1 ? 's' : ''}
          </Text>
          {trip.totalBudget > 0 && (
            <View style={s.budgetSection}>
              <View style={s.budgetRow}>
                <Text style={s.budgetLabel}>Budget: {fmt(trip.totalBudget, trip.currency)}</Text>
                <Text style={s.budgetLabel}>Planned: {fmt(totalPlanned, trip.currency)}</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFg, { width: `${budgetUsed}%` as any, backgroundColor: budgetUsed > 90 ? '#F87171' : trip.coverColor }]} />
              </View>
              <Text style={s.budgetPct}>{budgetUsed}% of budget planned</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Items</Text>
            <Text style={s.statValue}>{trip.expenses.length}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Paid</Text>
            <Text style={[s.statValue, { color: '#34D399' }]}>{paidCount}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Planned</Text>
            <Text style={s.statValue}>{fmt(totalPlanned, trip.currency)}</Text>
          </View>
          {totalActual > 0 && (
            <View style={s.statCard}>
              <Text style={s.statLabel}>Actual</Text>
              <Text style={[s.statValue, { color: totalActual > totalPlanned ? '#F87171' : '#34D399' }]}>
                {fmt(totalActual, trip.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>By Category</Text>
            {byCategory.map(([cat, amt]) => (
              <View key={cat} style={s.catBreakRow}>
                <Text style={s.catBreakIcon}>{CATEGORY_ICONS[cat as TripExpenseCategory]}</Text>
                <Text style={s.catBreakName}>{cat}</Text>
                <Text style={s.catBreakAmt}>{fmt(amt, trip.currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expenses list */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Items</Text>
            <TouchableOpacity style={s.addItemBtn} onPress={onAddExpense}>
              <Text style={s.addItemBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {trip.expenses.length === 0 ? (
            <View style={s.emptyItems}>
              <Text style={s.emptyItemsText}>No items yet. Tap '+ Add' to plan expenses.</Text>
            </View>
          ) : (
            trip.expenses.map(e => (
              <View key={e.id} style={s.expItem}>
                <View style={s.expItemLeft}>
                  <Text style={s.expItemIcon}>{CATEGORY_ICONS[e.category]}</Text>
                  <View>
                    <Text style={s.expItemDesc}>{e.description}</Text>
                    <Text style={s.expItemMeta}>{e.category}{e.date ? ` · ${e.date}` : ''}</Text>
                  </View>
                </View>
                <View style={s.expItemRight}>
                  <Text style={s.expItemPlanned}>{fmt(e.plannedAmount, trip.currency)}</Text>
                  {e.actualAmount !== undefined && (
                    <Text style={[s.expItemActual, { color: e.actualAmount > e.plannedAmount ? '#F87171' : '#34D399' }]}>
                      {fmt(e.actualAmount, trip.currency)}
                    </Text>
                  )}
                  <View style={[s.paidBadge, { backgroundColor: e.paid ? '#34D39922' : '#33415522' }]}>
                    <Text style={[s.paidBadgeText, { color: e.paid ? '#34D399' : '#64748B' }]}>
                      {e.paid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                  <View style={s.expItemActions}>
                    <TouchableOpacity onPress={() => onEditExpense(e)} style={s.expActionBtn}>
                      <Text style={s.expActionBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      Alert.alert('Delete Item', `Delete "${e.description}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => onDeleteExpense(e.id) },
                      ]);
                    }} style={s.expActionBtn}>
                      <Text style={s.expActionBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {trip.notes && (
          <View style={[s.section, { marginTop: 4 }]}>
            <Text style={s.sectionTitle}>Notes</Text>
            <Text style={s.notesText}>{trip.notes}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={onAddExpense}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Trip Card ──────────────────────────────────────────────

function TripCard({ trip, onPress, onEdit, onDelete }: {
  trip: Trip; onPress: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const totalPlanned = trip.expenses.reduce((s, e) => s + e.plannedAmount, 0);
  const days = tripDays(trip.startDate, trip.endDate);
  const paidCount = trip.expenses.filter(e => e.paid).length;

  return (
    <TouchableOpacity style={[s.tripCard, { borderLeftColor: trip.coverColor, borderLeftWidth: 3 }]}
      onPress={onPress} activeOpacity={0.7}>
      <View style={s.tripCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.tripCardName}>{trip.name}</Text>
          <Text style={s.tripCardDest}>📍 {trip.destination}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: statusColor(trip.status) + '22' }]}>
          <Text style={[s.statusPillText, { color: statusColor(trip.status) }]}>{statusLabel(trip.status)}</Text>
        </View>
      </View>
      <Text style={s.tripCardDates}>{trip.startDate} → {trip.endDate} · {days}d</Text>
      <View style={s.tripCardStats}>
        <Text style={s.tripCardStat}>{trip.expenses.length} items · {paidCount} paid</Text>
        <Text style={s.tripCardAmt}>{fmt(totalPlanned, trip.currency)} planned</Text>
      </View>
      {trip.totalBudget > 0 && (
        <View style={s.progressBg}>
          <View style={[s.progressFg, {
            width: `${Math.min(100, Math.round((totalPlanned / trip.totalBudget) * 100))}%` as any,
            backgroundColor: trip.coverColor,
          }]} />
        </View>
      )}
      <View style={s.tripCardActions}>
        <TouchableOpacity onPress={onEdit} style={s.tripActionBtn}>
          <Text style={s.tripActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[s.tripActionBtn, { backgroundColor: '#DC262622' }]}>
          <Text style={[s.tripActionText, { color: '#F87171' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────

export default function TripsScreen() {
  const { trips, isLoaded, addTrip, updateTrip, deleteTrip, addTripExpense, updateTripExpense, deleteTripExpense } = useTrips();

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | undefined>();

  function handleDeleteTrip(trip: Trip) {
    Alert.alert('Delete Trip', `Delete "${trip.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteTrip(trip.id);
        if (selectedTrip?.id === trip.id) setSelectedTrip(null);
      }},
    ]);
  }

  if (!isLoaded) return <LoadingSpinner />;

  if (selectedTrip) {
    const live = trips.find(t => t.id === selectedTrip.id) ?? selectedTrip;
    return (
      <>
        <TripDetailScreen
          trip={live}
          onBack={() => setSelectedTrip(null)}
          onEdit={() => { setEditingTrip(live); setShowTripForm(true); }}
          onAddExpense={() => { setEditingExpense(undefined); setShowExpenseForm(true); }}
          onEditExpense={e => { setEditingExpense(e); setShowExpenseForm(true); }}
          onDeleteExpense={id => deleteTripExpense(live.id, id)}
        />
        <TripExpenseModal
          visible={showExpenseForm}
          onClose={() => { setShowExpenseForm(false); setEditingExpense(undefined); }}
          onSave={data => {
            if (editingExpense) updateTripExpense(live.id, data);
            else addTripExpense(live.id, data);
          }}
          editing={editingExpense}
          currency={live.currency}
        />
        <TripFormModal
          visible={showTripForm}
          onClose={() => { setShowTripForm(false); setEditingTrip(undefined); }}
          onSave={data => {
            if (editingTrip) updateTrip(editingTrip.id, data);
          }}
          editing={editingTrip}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Trips</Text>
          <Text style={s.headerSub}>{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditingTrip(undefined); setShowTripForm(true); }}>
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={item => item.id}
        contentContainerStyle={trips.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          <EmptyState icon="✈️" title="No trips yet" subtitle="Tap '+ New' to plan your first trip"
            actionTitle="New Trip" onAction={() => { setEditingTrip(undefined); setShowTripForm(true); }} />
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => setSelectedTrip(item)}
            onEdit={() => { setEditingTrip(item); setShowTripForm(true); }}
            onDelete={() => handleDeleteTrip(item)}
          />
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => { setEditingTrip(undefined); setShowTripForm(true); }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <TripFormModal
        visible={showTripForm}
        onClose={() => { setShowTripForm(false); setEditingTrip(undefined); }}
        onSave={data => {
          if (editingTrip) updateTrip(editingTrip.id, data);
          else addTrip({ ...data, expenses: [] });
        }}
        editing={editingTrip}
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
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, paddingHorizontal: 16 },
  tripCard: {
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  tripCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  tripCardName: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  tripCardDest: { color: '#94A3B8', fontSize: 13 },
  tripCardDates: { color: '#64748B', fontSize: 12, marginBottom: 6 },
  tripCardStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tripCardStat: { color: '#64748B', fontSize: 12 },
  tripCardAmt: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  tripCardActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  tripActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1E293B22' },
  tripActionText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  statusPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  // Detail
  detailHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: '#A78BFA', fontSize: 15, fontWeight: '600' },
  editBtn: { backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  coverCard: {
    margin: 16, borderRadius: 16, padding: 16, borderWidth: 1,
  },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tripName: { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  tripDestination: { color: '#94A3B8', fontSize: 14 },
  tripDates: { color: '#64748B', fontSize: 13, marginBottom: 10 },
  budgetSection: {},
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel: { color: '#94A3B8', fontSize: 12 },
  budgetPct: { color: '#64748B', fontSize: 11, marginTop: 4 },
  progressBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  progressFg: { height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, minWidth: 80, borderWidth: 1, borderColor: '#334155' },
  statLabel: { color: '#64748B', fontSize: 10, marginBottom: 4 },
  statValue: { color: 'white', fontSize: 14, fontWeight: '800' },
  section: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addItemBtn: { backgroundColor: '#7C3AED22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  addItemBtnText: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  catBreakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catBreakIcon: { fontSize: 16 },
  catBreakName: { flex: 1, color: '#94A3B8', fontSize: 13 },
  catBreakAmt: { color: 'white', fontSize: 13, fontWeight: '600' },
  expItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  expItemLeft: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', flex: 1 },
  expItemIcon: { fontSize: 18, marginTop: 2 },
  expItemDesc: { color: 'white', fontSize: 13, fontWeight: '600' },
  expItemMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  expItemRight: { alignItems: 'flex-end', gap: 3 },
  expItemPlanned: { color: 'white', fontSize: 13, fontWeight: '700' },
  expItemActual: { fontSize: 12, fontWeight: '600' },
  paidBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  paidBadgeText: { fontSize: 10, fontWeight: '700' },
  expItemActions: { flexDirection: 'row', gap: 4, marginTop: 2 },
  expActionBtn: { padding: 2 },
  expActionBtnText: { fontSize: 13 },
  emptyItems: { paddingVertical: 20, alignItems: 'center' },
  emptyItemsText: { color: '#475569', fontSize: 13, textAlign: 'center' },
  notesText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: '300', marginTop: -2 },
  // Modal
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
  row: { flexDirection: 'row', gap: 8 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: 'white' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  statusBtnActive: { backgroundColor: '#7C3AED22', borderColor: '#7C3AED' },
  statusBtnText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  dropdown: { backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginTop: 4, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownText: { color: '#94A3B8', fontSize: 14 },
  paidToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  checkmark: { color: 'white', fontSize: 13, fontWeight: '800' },
  paidLabel: { color: '#94A3B8', fontSize: 14 },
  errorText: { color: '#F87171', fontSize: 13, marginTop: 8 },
});
