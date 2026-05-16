import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth, AccountLinkError } from '../../contexts/AuthContext';
import { PasswordInput } from '../../components/ui/PasswordInput';
import type { OAuthCredential } from 'firebase/auth';

type LinkPending = { email: string; credential: OAuthCredential };

export default function LoginScreen() {
  const { signInEmail, signInGoogle, linkGoogleToEmailAccount } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkPending, setLinkPending] = useState<LinkPending | null>(null);
  const [linkPassword, setLinkPassword] = useState('');

  async function handleSignIn() {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setLoading(true);
    try {
      await signInEmail(email.trim(), password);
      router.replace('/(app)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInGoogle();
      router.replace('/(app)');
    } catch (e: unknown) {
      if (e instanceof AccountLinkError) {
        setLinkPending({ email: e.email, credential: e.pendingCredential });
        setLinkPassword('');
      } else {
        setError(e instanceof Error ? e.message : 'Google sign in failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkAccounts() {
    if (!linkPending || !linkPassword) { setError('Please enter your password'); return; }
    setError('');
    setLoading(true);
    try {
      await linkGoogleToEmailAccount(linkPending.email, linkPassword, linkPending.credential);
      router.replace('/(app)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to link accounts');
    } finally {
      setLoading(false);
    }
  }

  if (linkPending) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0F172A' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>Link Accounts</Text>
          </View>

          <View style={{ backgroundColor: '#1E1B4B', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#6D28D9' }}>
            <Text style={{ color: '#A78BFA', fontWeight: '600', marginBottom: 4 }}>Account already exists</Text>
            <Text style={{ color: '#C4B5FD', fontSize: 14, lineHeight: 20 }}>
              An account with <Text style={{ fontWeight: '600' }}>{linkPending.email}</Text> already exists. Enter your password to link your Google account.
            </Text>
          </View>

          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Email</Text>
            <TextInput
              style={{ backgroundColor: '#1E293B', color: '#94A3B8', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
              value={linkPending.email}
              editable={false}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Password</Text>
            <PasswordInput
              inputStyle={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
              value={linkPassword}
              onChangeText={setLinkPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
            onPress={handleLinkAccounts}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Connect Google & Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 12, alignItems: 'center' }}
            onPress={() => { setLinkPending(null); setError(''); }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#7C3AED' }}>💰</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 8 }}>Expense Tracker</Text>
          <Text style={{ color: '#94A3B8', marginTop: 4 }}>Sign in to your account</Text>
        </View>

        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Email</Text>
          <TextInput
            style={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Password</Text>
          <PasswordInput
            inputStyle={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
          />
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 24 }}
          onPress={handleGoogle}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontSize: 16, marginLeft: 8 }}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>Don't have an account? </Text>
          <Link href="/(auth)/register" style={{ color: '#7C3AED', fontWeight: 'bold' }}>Register</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
