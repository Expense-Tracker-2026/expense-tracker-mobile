import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncome } from '../../hooks/useIncome';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SUBSCRIPTION_TIERS } from '../../lib/types';

export default function ProfileScreen() {
  const { user, logout, updateDisplayName, changePassword, changeEmail, deleteAccount, isEmailProvider } = useAuth();
  const { profile, isLoaded, saveProfile } = useUserProfile();
  const { expenses } = useExpenses();
  const { income } = useIncome();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [country, setCountry] = useState(profile?.country ?? 'Australia');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Security fields
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [currentPwEmail, setCurrentPwEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePw, setDeletePw] = useState('');

  if (!isLoaded) return <LoadingSpinner />;

  const tier = profile?.subscriptionTier ?? 'free';
  const tierInfo = SUBSCRIPTION_TIERS[tier];

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await saveProfile({ displayName, phone, occupation, country, bio });
      if (displayName !== user?.displayName) await updateDisplayName(displayName);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw) { Alert.alert('Error', 'Fill in all fields'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    try {
      await changePassword(currentPw, newPw);
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false); setCurrentPw(''); setNewPw('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleChangeEmail() {
    if (!currentPwEmail || !newEmail) { Alert.alert('Error', 'Fill in all fields'); return; }
    try {
      await changeEmail(currentPwEmail, newEmail);
      Alert.alert('Success', 'Email changed successfully');
      setShowChangeEmail(false); setCurrentPwEmail(''); setNewEmail('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') { Alert.alert('Error', 'Type DELETE to confirm'); return; }
    try {
      await deleteAccount(isEmailProvider ? deletePw : undefined);
      await logout();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.profileHeader}>
          <Avatar name={profile?.displayName || user?.email || '?'} color={profile?.avatarColor ?? '#7C3AED'} size={80} />
          <Text style={styles.displayName}>{profile?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{tierInfo.emoji} {tierInfo.label}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{income.length}</Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity onPress={() => editing ? handleSaveProfile() : setEditing(true)}>
              <Text style={styles.editBtn}>{editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              <FormField label="Display Name">
                <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholderTextColor="#475569" />
              </FormField>
              <FormField label="Phone">
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#475569" keyboardType="phone-pad" />
              </FormField>
              <FormField label="Occupation">
                <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Your occupation" placeholderTextColor="#475569" />
              </FormField>
              <FormField label="Country">
                <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#475569" />
              </FormField>
              <FormField label="Bio">
                <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="A short bio..." placeholderTextColor="#475569" multiline numberOfLines={3} />
              </FormField>
              <View style={styles.btnRow}>
                <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={styles.btnFlex} />
                <Button title="Save" onPress={handleSaveProfile} loading={saving} style={styles.btnFlex} />
              </View>
            </>
          ) : (
            <>
              {[
                { label: 'Name', value: profile?.displayName },
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: profile?.phone },
                { label: 'Occupation', value: profile?.occupation },
                { label: 'Country', value: profile?.country },
                { label: 'Bio', value: profile?.bio },
              ].filter(i => i.value).map(item => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Security */}
        {isEmailProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowChangePassword(!showChangePassword)}>
              <Text style={styles.actionLabel}>🔑 Change Password</Text>
              <Text style={styles.chevron}>{showChangePassword ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showChangePassword && (
              <View style={styles.subForm}>
                <FormField label="Current Password">
                  <TextInput style={styles.input} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <FormField label="New Password">
                  <TextInput style={styles.input} value={newPw} onChangeText={setNewPw} secureTextEntry placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <Button title="Change Password" onPress={handleChangePassword} />
              </View>
            )}
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowChangeEmail(!showChangeEmail)}>
              <Text style={styles.actionLabel}>✉️ Change Email</Text>
              <Text style={styles.chevron}>{showChangeEmail ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showChangeEmail && (
              <View style={styles.subForm}>
                <FormField label="Current Password">
                  <TextInput style={styles.input} value={currentPwEmail} onChangeText={setCurrentPwEmail} secureTextEntry placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <FormField label="New Email">
                  <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#475569" placeholder="new@email.com" />
                </FormField>
                <Button title="Change Email" onPress={handleChangeEmail} />
              </View>
            )}
          </View>
        )}

        {/* Sign Out */}
        <View style={styles.section}>
          <Button title="Sign Out" variant="outline" onPress={logout} />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowDelete(!showDelete)}>
            <Text style={[styles.actionLabel, { color: '#EF4444' }]}>🗑️ Delete Account</Text>
            <Text style={styles.chevron}>{showDelete ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showDelete && (
            <View style={styles.subForm}>
              <Text style={styles.deleteWarning}>This will permanently delete all your data. Type DELETE to confirm.</Text>
              <FormField label="Type DELETE">
                <TextInput style={styles.input} value={deleteConfirm} onChangeText={setDeleteConfirm} autoCapitalize="characters" placeholderTextColor="#475569" placeholder="DELETE" />
              </FormField>
              {isEmailProvider && (
                <FormField label="Your Password">
                  <TextInput style={styles.input} value={deletePw} onChangeText={setDeletePw} secureTextEntry placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
              )}
              <Button title="Delete My Account" variant="danger" onPress={handleDeleteAccount} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center', paddingTop: 24, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  displayName: { color: 'white', fontSize: 22, fontWeight: '800', marginTop: 12 },
  email: { color: '#64748B', fontSize: 13, marginTop: 4 },
  tierBadge: {
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#7C3AED22', borderRadius: 20, borderWidth: 1, borderColor: '#7C3AED44',
  },
  tierText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#334155',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: 'white', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 8 },
  section: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  dangerSection: { borderColor: '#EF444422' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  editBtn: { color: '#A78BFA', fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { width: 90, color: '#64748B', fontSize: 13 },
  infoValue: { flex: 1, color: 'white', fontSize: 13 },
  input: {
    backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    padding: 14, color: 'white', fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnFlex: { flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  actionLabel: { color: 'white', fontSize: 15 },
  chevron: { color: '#64748B', fontSize: 12 },
  subForm: { paddingTop: 8 },
  deleteWarning: { color: '#EF4444', fontSize: 12, marginBottom: 12, lineHeight: 18 },
});
