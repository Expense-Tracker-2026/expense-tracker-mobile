import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/Button';
import type { Account, AccountType } from '../../lib/types';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Checking', icon: '🏦' },
  { value: 'savings', label: 'Savings', icon: '💰' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'super', label: 'Super', icon: '🏗️' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'credit', label: 'Credit', icon: '💳' },
  { value: 'loan', label: 'Loan', icon: '🏠' },
];

const COLORS = ['#7C3AED', '#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#DB2777', '#6B7280'];

interface AccountFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initial?: Partial<Account>;
}

export function AccountForm({ visible, onClose, onSave, initial }: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'checking');
  const [balance, setBalance] = useState(initial?.balance != null ? String(initial.balance) : '0');
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (isNaN(parseFloat(balance))) errs.balance = 'Enter a valid balance';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        balance: parseFloat(balance),
        institution: institution.trim() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const selectedType = ACCOUNT_TYPES.find(t => t.value === type);

  return (
    <Modal visible={visible} onClose={onClose} title={initial?.id ? 'Edit Account' : 'Add Account'}>
      <FormField label="Account Name" error={errors.name}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Main Checking"
          placeholderTextColor="#475569"
        />
      </FormField>

      <FormField label="Account Type">
        <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(true)}>
          <Text style={styles.pickerText}>{selectedType?.icon} {selectedType?.label}</Text>
        </TouchableOpacity>
      </FormField>

      <FormField label="Balance" error={errors.balance}>
        <TextInput
          style={styles.input}
          value={balance}
          onChangeText={setBalance}
          placeholder="0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
        />
      </FormField>

      <FormField label="Institution (optional)">
        <TextInput
          style={styles.input}
          value={institution}
          onChangeText={setInstitution}
          placeholder="Bank or institution name"
          placeholderTextColor="#475569"
        />
      </FormField>

      <FormField label="Color">
        <View style={styles.colorRow}>
          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </FormField>

      <FormField label="Notes (optional)">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={2}
        />
      </FormField>

      <View style={styles.btnRow}>
        <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btnFlex} />
        <Button title="Save" onPress={handleSave} loading={saving} style={styles.btnFlex} />
      </View>

      <Modal visible={showTypePicker} onClose={() => setShowTypePicker(false)} title="Account Type">
        {ACCOUNT_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.optionRow, type === t.value && styles.optionRowActive]}
            onPress={() => { setType(t.value); setShowTypePicker(false); }}
          >
            <Text style={styles.optionIcon}>{t.icon}</Text>
            <Text style={styles.optionText}>{t.label}</Text>
            {type === t.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    color: 'white',
    fontSize: 15,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  pickerText: {
    color: 'white',
    fontSize: 15,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: 'white',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnFlex: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 10,
  },
  optionRowActive: {
    backgroundColor: '#7C3AED11',
  },
  optionIcon: {
    fontSize: 18,
    width: 26,
  },
  optionText: {
    flex: 1,
    color: 'white',
    fontSize: 15,
  },
  checkmark: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
  },
});
