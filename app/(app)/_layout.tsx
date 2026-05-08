import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#475569',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💸</Text> }} />
      <Tabs.Screen name="income" options={{ title: 'Income', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💼</Text> }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text> }} />
      <Tabs.Screen name="savings" options={{ title: 'Savings', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏦</Text> }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💳</Text> }} />
      <Tabs.Screen name="tax" options={{ title: 'Tax', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text> }} />
      <Tabs.Screen name="loans" options={{ title: 'Loans', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🤝</Text> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✈️</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text> }} />
      <Tabs.Screen name="family" options={{ title: 'Family', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👨‍👩‍👧</Text> }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="tools" options={{ href: null }} />
      <Tabs.Screen name="investments" options={{ href: null }} />
    </Tabs>
  );
}
