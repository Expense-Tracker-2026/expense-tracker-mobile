import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordInput } from '../../components/ui/PasswordInput';

export default function RegisterScreen() {
  const { signUpEmail } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await signUpEmail(email.trim(), password, name.trim());
      router.replace('/(app)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
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
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 8 }}>Create Account</Text>
          <Text style={{ color: '#94A3B8', marginTop: 4 }}>Start tracking your finances</Text>
        </View>

        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Full Name</Text>
          <TextInput
            style={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#475569"
            autoCapitalize="words"
          />
        </View>

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

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Password</Text>
          <PasswordInput
            inputStyle={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94A3B8', marginBottom: 8, fontSize: 14 }}>Confirm Password</Text>
          <PasswordInput
            inputStyle={{ backgroundColor: '#1E293B', color: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#334155' }}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#475569"
          />
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 }}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>Already have an account? </Text>
          <Link href="/(auth)/login" style={{ color: '#7C3AED', fontWeight: 'bold' }}>Sign In</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
