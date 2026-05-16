import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, RefreshControl, Linking,
} from 'react-native';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useExpenses } from '../../hooks/useExpenses';
import { useIncome } from '../../hooks/useIncome';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { SUBSCRIPTION_TIERS } from '../../lib/types';

const WEB_APP_URL = 'https://expense-tracker-9e457.web.app';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateDisplayName, changePassword, changeEmail, deleteAccount, sendPasswordReset, isEmailProvider } = useAuth();
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

  // Login methods
  const isGoogleProvider = !!(user?.providerData?.some(p => p.providerId === 'google.com'));
  const [setupPwSent, setSetupPwSent] = useState(false);
  const [setupPwSending, setSetupPwSending] = useState(false);

  async function handleSetupPassword() {
    if (!user?.email) return;
    setSetupPwSending(true);
    try {
      await sendPasswordReset(user.email);
      setSetupPwSent(true);
    } catch {
      Alert.alert('Error', 'Could not send setup email.');
    } finally {
      setSetupPwSending(false);
    }
  }

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePw, setDeletePw] = useState('');

  const { colors, theme } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor={colors.refreshTint} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
          <Avatar name={profile?.displayName || user?.email || '?'} color={profile?.avatarColor ?? '#7C3AED'} size={80} />
          <Text style={[styles.displayName, { color: colors.text }]}>{profile?.displayName || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{tierInfo.emoji} {tierInfo.label}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{expenses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expenses</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{income.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Income</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Info</Text>
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
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowChangePassword(!showChangePassword)}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>🔑 Change Password</Text>
              <Text style={styles.chevron}>{showChangePassword ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showChangePassword && (
              <View style={styles.subForm}>
                <FormField label="Current Password">
                  <PasswordInput inputStyle={styles.input} value={currentPw} onChangeText={setCurrentPw} placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <FormField label="New Password">
                  <PasswordInput inputStyle={styles.input} value={newPw} onChangeText={setNewPw} placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <Button title="Change Password" onPress={handleChangePassword} />
              </View>
            )}
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowChangeEmail(!showChangeEmail)}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>✉️ Change Email</Text>
              <Text style={styles.chevron}>{showChangeEmail ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showChangeEmail && (
              <View style={styles.subForm}>
                <FormField label="Current Password">
                  <PasswordInput inputStyle={styles.input} value={currentPwEmail} onChangeText={setCurrentPwEmail} placeholderTextColor="#475569" placeholder="••••••••" />
                </FormField>
                <FormField label="New Email">
                  <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#475569" placeholder="new@email.com" />
                </FormField>
                <Button title="Change Email" onPress={handleChangeEmail} />
              </View>
            )}
          </View>
        )}

        {/* Subscription */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>
          <View style={[styles.tierCard, { borderColor: tierInfo.color + '44', backgroundColor: colors.bgSecondary }]}>
            <View style={styles.tierCardLeft}>
              <Text style={styles.tierCardEmoji}>{tierInfo.emoji}</Text>
              <View>
                <Text style={[styles.tierCardName, { color: colors.text }]}>{tierInfo.label} Plan</Text>
                <Text style={[styles.tierCardSub, { color: colors.textMuted }]}>
                  {tier === 'free' ? 'Upgrade to unlock family & more' :
                   tier === 'diamond' ? 'Family up to 5 members' : 'Unlimited family members'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/subscription')}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>💎 Manage Subscription</Text>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => Linking.openURL(`${WEB_APP_URL}/subscription`)}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>🌐 Manage on Web App</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Family */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Family</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/family')}>
            <View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>👨‍👩‍👧 Family Members</Text>
              {tier === 'free' && (
                <Text style={styles.actionSub}>Requires Diamond or Platinum</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <ThemeToggle />
        </View>

        {/* Login Methods */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Login Methods</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>Link both methods so you can sign in with either one.</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Google</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isGoogleProvider ? 'Connected' : 'Not connected'}</Text>
            </View>
            {isGoogleProvider
              ? <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>Connected</Text></View>
              : <Text style={{ color: '#94A3B8', fontSize: 12 }}>Sign in with Google to link</Text>
            }
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Email &amp; Password</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isEmailProvider ? 'Connected' : 'Not connected'}</Text>
            </View>
            {isEmailProvider
              ? <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>Connected</Text></View>
              : setupPwSent
                ? <Text style={{ color: '#059669', fontSize: 12 }}>Email sent ✓</Text>
                : <TouchableOpacity onPress={handleSetupPassword} disabled={setupPwSending} style={{ backgroundColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{setupPwSending ? 'Sending…' : 'Set up password'}</Text>
                  </TouchableOpacity>
            }
          </View>
          {setupPwSent && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Check your inbox and follow the link to set your password.</Text>}
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Button title="Sign Out" variant="outline" onPress={logout} />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection, { backgroundColor: colors.bgCard }]}>
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
                  <PasswordInput inputStyle={styles.input} value={deletePw} onChangeText={setDeletePw} placeholderTextColor="#475569" placeholder="••••••••" />
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
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center', paddingTop: 24, paddingBottom: 20,
    borderBottomWidth: 1,
  },
  displayName: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  email: { fontSize: 13, marginTop: 4 },
  tierBadge: {
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#7C3AED22', borderRadius: 20, borderWidth: 1, borderColor: '#7C3AED44',
  },
  tierText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20, borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 40, marginHorizontal: 8 },
  section: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  dangerSection: { borderColor: '#EF444422' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  editBtn: { color: '#A78BFA', fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#33415540' },
  infoLabel: { width: 90, color: '#64748B', fontSize: 13 },
  infoValue: { flex: 1, fontSize: 13 },
  input: {
    borderRadius: 10, borderWidth: 1,
    padding: 14, fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnFlex: { flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  actionLabel: { fontSize: 15 },
  chevron: { fontSize: 12 },
  subForm: { paddingTop: 8 },
  deleteWarning: { color: '#EF4444', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  tierCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1,
  },
  tierCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierCardEmoji: { fontSize: 28 },
  tierCardName: { fontSize: 15, fontWeight: '700' },
  tierCardSub: { fontSize: 12, marginTop: 2 },
  actionSub: { color: '#475569', fontSize: 11, marginTop: 2 },
});
