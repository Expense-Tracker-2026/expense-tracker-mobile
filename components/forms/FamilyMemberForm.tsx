import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/Button';
import type { FamilyMember, FamilyRelationship } from '../../lib/types';

const RELATIONSHIPS: FamilyRelationship[] = ['Self', 'Spouse/Partner', 'Child', 'Parent', 'Sibling', 'Other'];
const COLORS = ['#7C3AED', '#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#DB2777', '#6B7280'];

interface FamilyMemberFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initial?: Partial<FamilyMember>;
}

export function FamilyMemberForm({ visible, onClose, onSave, initial }: FamilyMemberFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [relationship, setRelationship] = useState<FamilyRelationship>(initial?.relationship ?? 'Other');
  const [showRelPicker, setShowRelPicker] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarColor, setAvatarColor] = useState(initial?.avatarColor ?? COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        relationship,
        dateOfBirth: dateOfBirth || undefined,
        avatarColor,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={initial?.id ? 'Edit Member' : 'Add Family Member'}>
      <FormField label="Full Name" error={errors.name}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor="#475569"
          autoCapitalize="words"
        />
      </FormField>

      <FormField label="Relationship">
        <TouchableOpacity style={styles.picker} onPress={() => setShowRelPicker(true)}>
          <Text style={styles.pickerText}>{relationship}</Text>
        </TouchableOpacity>
      </FormField>

      <FormField label="Phone (optional)">
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+61 4xx xxx xxx"
          placeholderTextColor="#475569"
          keyboardType="phone-pad"
        />
      </FormField>

      <FormField label="Date of Birth (optional)">
        <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerText}>📅 {dateOfBirth || 'Not set'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (d) setDateOfBirth(d.toISOString().split('T')[0]);
            }}
            maximumDate={new Date()}
          />
        )}
        {dateOfBirth ? (
          <TouchableOpacity onPress={() => setDateOfBirth('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear date</Text>
          </TouchableOpacity>
        ) : null}
      </FormField>

      <FormField label="Avatar Color">
        <View style={styles.colorRow}>
          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, avatarColor === c && styles.colorDotActive]}
              onPress={() => setAvatarColor(c)}
            />
          ))}
        </View>
      </FormField>

      <View style={styles.btnRow}>
        <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btnFlex} />
        <Button title="Save" onPress={handleSave} loading={saving} style={styles.btnFlex} />
      </View>

      <Modal visible={showRelPicker} onClose={() => setShowRelPicker(false)} title="Relationship">
        {RELATIONSHIPS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.optionRow, relationship === r && styles.optionRowActive]}
            onPress={() => { setRelationship(r); setShowRelPicker(false); }}
          >
            <Text style={styles.optionText}>{r}</Text>
            {relationship === r && <Text style={styles.checkmark}>✓</Text>}
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  optionRowActive: {
    backgroundColor: '#7C3AED11',
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
