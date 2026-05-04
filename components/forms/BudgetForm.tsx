import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/Button';
import { CATEGORIES, CATEGORY_ICONS } from '../../lib/categories';
import type { Budget, Category } from '../../lib/types';

interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initial?: Partial<Budget>;
  existingCategories?: Category[];
}

export function BudgetForm({ visible, onClose, onSave, initial, existingCategories = [] }: BudgetFormProps) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(initial?.monthlyLimit != null ? String(initial.monthlyLimit) : '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableCategories = CATEGORIES.filter(c =>
    c.name === initial?.category || !existingCategories.includes(c.name)
  );

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!monthlyLimit || isNaN(parseFloat(monthlyLimit)) || parseFloat(monthlyLimit) <= 0) {
      errs.monthlyLimit = 'Enter a valid monthly limit';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({ category, monthlyLimit: parseFloat(monthlyLimit) });
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={initial?.id ? 'Edit Budget' : 'Add Budget'}>
      <FormField label="Category">
        <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.pickerText}>{CATEGORY_ICONS[category]} {category}</Text>
        </TouchableOpacity>
      </FormField>

      <FormField label="Monthly Limit" error={errors.monthlyLimit}>
        <TextInput
          style={styles.input}
          value={monthlyLimit}
          onChangeText={setMonthlyLimit}
          placeholder="0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
        />
      </FormField>

      <View style={styles.btnRow}>
        <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btnFlex} />
        <Button title="Save" onPress={handleSave} loading={saving} style={styles.btnFlex} />
      </View>

      <Modal visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)} title="Select Category">
        {availableCategories.map(c => (
          <TouchableOpacity
            key={c.name}
            style={[styles.optionRow, category === c.name && styles.optionRowActive]}
            onPress={() => { setCategory(c.name); setShowCategoryPicker(false); }}
          >
            <Text style={styles.optionIcon}>{CATEGORY_ICONS[c.name]}</Text>
            <Text style={styles.optionText}>{c.name}</Text>
            {category === c.name && <Text style={styles.checkmark}>✓</Text>}
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
