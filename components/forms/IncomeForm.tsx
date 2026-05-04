import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch, StyleSheet,
  Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';
import { AttachmentPicker } from './AttachmentPicker';
import { INCOME_CATEGORIES, INCOME_CATEGORY_ICONS } from '../../lib/incomeCategories';
import { CURRENCIES } from '../../lib/currency';
import { useAccounts } from '../../hooks/useAccounts';
import { useFamily } from '../../contexts/FamilyContext';
import type { IncomeFormData, IncomeCategory, AttachmentMeta } from '../../lib/types';

interface IncomeFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: IncomeFormData) => Promise<void>;
  initial?: Partial<IncomeFormData>;
  incomeId?: string;
}

export function IncomeForm({ visible, onClose, onSave, initial, incomeId }: IncomeFormProps) {
  const { accounts } = useAccounts();
  const { isFamilyEnabled, members } = useFamily();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initial?.date ?? today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [currency, setCurrency] = useState('AUD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [category, setCategory] = useState<IncomeCategory>(initial?.category ?? 'Other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [employer, setEmployer] = useState(initial?.employer ?? '');
  const [isPayg, setIsPayg] = useState(false);
  const [grossAmount, setGrossAmount] = useState(initial?.grossAmount ?? '');
  const [taxWithheld, setTaxWithheld] = useState(initial?.taxWithheld ?? '');
  const [superannuation, setSuperannuation] = useState(initial?.superannuation ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [accountId, setAccountId] = useState(initial?.accountId ?? '');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [memberId, setMemberId] = useState(initial?.memberId ?? '');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentMeta | undefined>(initial?.attachment);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errs.amount = 'Enter a valid amount';
    }
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        date,
        amount,
        category,
        description: description.trim(),
        employer: employer || undefined,
        grossAmount: isPayg ? grossAmount : undefined,
        taxWithheld: isPayg ? taxWithheld : undefined,
        superannuation: isPayg ? superannuation : undefined,
        tags,
        attachment,
        accountId: accountId || undefined,
        memberId: memberId || undefined,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <Modal visible={visible} onClose={onClose} title={incomeId ? 'Edit Income' : 'Add Income'} fullHeight>
      {/* Date */}
      <FormField label="Date" error={errors.date}>
        <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerText}>📅 {date}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (d) setDate(d.toISOString().split('T')[0]);
            }}
            maximumDate={new Date()}
          />
        )}
      </FormField>

      {/* Amount */}
      <FormField label="Net Amount" error={errors.amount}>
        <View style={styles.amountRow}>
          <TouchableOpacity style={styles.currencyBtn} onPress={() => setShowCurrencyPicker(true)}>
            <Text style={styles.currencyText}>{currency}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
          />
        </View>
      </FormField>

      {/* Category */}
      <FormField label="Category">
        <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.pickerText}>
            {INCOME_CATEGORY_ICONS[category]} {category}
          </Text>
        </TouchableOpacity>
      </FormField>

      {/* Description */}
      <FormField label="Description" error={errors.description}>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Income source description"
          placeholderTextColor="#475569"
          multiline
          numberOfLines={2}
        />
      </FormField>

      {/* Employer */}
      <FormField label="Employer (optional)">
        <TextInput
          style={styles.input}
          value={employer}
          onChangeText={setEmployer}
          placeholder="Employer or payer name"
          placeholderTextColor="#475569"
        />
      </FormField>

      {/* PAYG toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>PAYG Payment Summary</Text>
          <Text style={styles.toggleSub}>Add gross, tax withheld & super</Text>
        </View>
        <Switch
          value={isPayg}
          onValueChange={setIsPayg}
          trackColor={{ false: '#334155', true: '#10B981' }}
          thumbColor="white"
        />
      </View>

      {isPayg && (
        <View style={styles.paygSection}>
          <FormField label="Gross Amount">
            <TextInput
              style={styles.input}
              value={grossAmount}
              onChangeText={setGrossAmount}
              placeholder="0.00"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Tax Withheld">
            <TextInput
              style={styles.input}
              value={taxWithheld}
              onChangeText={setTaxWithheld}
              placeholder="0.00"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Superannuation">
            <TextInput
              style={styles.input}
              value={superannuation}
              onChangeText={setSuperannuation}
              placeholder="0.00"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
          </FormField>
        </View>
      )}

      {/* Account */}
      <FormField label="Account (optional)">
        <TouchableOpacity style={styles.picker} onPress={() => setShowAccountPicker(true)}>
          <Text style={styles.pickerText}>
            {selectedAccount ? `${selectedAccount.name} (${selectedAccount.type})` : 'No account'}
          </Text>
        </TouchableOpacity>
      </FormField>

      {/* Family member */}
      {isFamilyEnabled && (
        <FormField label="Family Member (optional)">
          <TouchableOpacity style={styles.picker} onPress={() => setShowMemberPicker(true)}>
            <Text style={styles.pickerText}>
              {memberId ? (members.find(m => m.id === memberId)?.name ?? 'Unknown') : 'Shared / Family'}
            </Text>
          </TouchableOpacity>
        </FormField>
      )}

      {/* Tags */}
      <FormField label="Tags">
        <TagInput tags={tags} onChange={setTags} />
      </FormField>

      {/* Attachment */}
      <FormField label="Attachment">
        <AttachmentPicker attachment={attachment} onAttachmentChange={setAttachment} expenseId={incomeId} />
      </FormField>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btnFlex} />
        <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} loading={saving} style={styles.btnFlex} />
      </View>

      {/* Category picker */}
      <Modal visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)} title="Select Category">
        {INCOME_CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.name}
            style={[styles.optionRow, category === c.name && styles.optionRowActive]}
            onPress={() => { setCategory(c.name); setShowCategoryPicker(false); }}
          >
            <Text style={styles.optionIcon}>{INCOME_CATEGORY_ICONS[c.name]}</Text>
            <Text style={styles.optionText}>{c.name}</Text>
            {category === c.name && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Currency picker */}
      <Modal visible={showCurrencyPicker} onClose={() => setShowCurrencyPicker(false)} title="Select Currency">
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.code}
            style={[styles.optionRow, currency === c.code && styles.optionRowActive]}
            onPress={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
          >
            <Text style={styles.optionText}>{c.code} — {c.name}</Text>
            {currency === c.code && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Account picker */}
      <Modal visible={showAccountPicker} onClose={() => setShowAccountPicker(false)} title="Select Account">
        <TouchableOpacity
          style={[styles.optionRow, !accountId && styles.optionRowActive]}
          onPress={() => { setAccountId(''); setShowAccountPicker(false); }}
        >
          <Text style={styles.optionText}>No account</Text>
          {!accountId && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        {accounts.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[styles.optionRow, accountId === a.id && styles.optionRowActive]}
            onPress={() => { setAccountId(a.id); setShowAccountPicker(false); }}
          >
            <View style={[styles.accountDot, { backgroundColor: a.color }]} />
            <Text style={styles.optionText}>{a.name}</Text>
            {accountId === a.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Member picker */}
      {isFamilyEnabled && (
        <Modal visible={showMemberPicker} onClose={() => setShowMemberPicker(false)} title="Select Member">
          <TouchableOpacity
            style={[styles.optionRow, !memberId && styles.optionRowActive]}
            onPress={() => { setMemberId(''); setShowMemberPicker(false); }}
          >
            <Text style={styles.optionText}>Shared / Family</Text>
            {!memberId && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          {members.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.optionRow, memberId === m.id && styles.optionRowActive]}
              onPress={() => { setMemberId(m.id); setShowMemberPicker(false); }}
            >
              <Text style={styles.optionText}>{m.name}</Text>
              {memberId === m.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    minWidth: 70,
    alignItems: 'center',
  },
  currencyText: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 16,
  },
  toggleLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  paygSection: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingLeft: 12,
    marginBottom: 8,
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
    textAlign: 'center',
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
  accountDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
