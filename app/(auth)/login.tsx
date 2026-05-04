import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { signInEmail, signInGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(e instanceof Error ? e.message : 'Google sign in failed');
    } finally {
      setLoading(false);
    }
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
          <TextInput
            style={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry
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
