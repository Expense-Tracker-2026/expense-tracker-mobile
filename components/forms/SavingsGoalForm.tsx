import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/Button';
import type { SavingsGoal } from '../../lib/types';

const COLORS = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#EF4444', '#6366F1', '#06B6D4'];

interface SavingsGoalFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initial?: Partial<SavingsGoal>;
}

export function SavingsGoalForm({ visible, onClose, onSave, initial }: SavingsGoalFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount != null ? String(initial.targetAmount) : '');
  const [currentAmount, setCurrentAmount] = useState(initial?.currentAmount != null ? String(initial.currentAmount) : '0');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      errs.targetAmount = 'Enter a valid target amount';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || undefined,
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

  return (
    <Modal visible={visible} onClose={onClose} title={initial?.id ? 'Edit Goal' : 'Add Savings Goal'}>
      <FormField label="Goal Name" error={errors.name}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Emergency Fund"
          placeholderTextColor="#475569"
        />
      </FormField>

      <FormField label="Target Amount" error={errors.targetAmount}>
        <TextInput
          style={styles.input}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
        />
      </FormField>

      <FormField label="Current Amount">
        <TextInput
          style={styles.input}
          value={currentAmount}
          onChangeText={setCurrentAmount}
          placeholder="0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
        />
      </FormField>

      <FormField label="Deadline (optional)">
        <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerText}>📅 {deadline || 'No deadline'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={deadline ? new Date(deadline) : new Date()}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (d) setDeadline(d.toISOString().split('T')[0]);
            }}
            minimumDate={new Date()}
          />
        )}
        {deadline ? (
          <TouchableOpacity onPress={() => setDeadline('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear deadline</Text>
          </TouchableOpacity>
        ) : null}
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
  clearBtn: {
    marginTop: 6,
  },
  clearText: {
    color: '#64748B',
    fontSize: 12,
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
});
