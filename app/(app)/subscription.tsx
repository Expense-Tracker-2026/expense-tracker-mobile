import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '../../lib/types';

const PLANS: {
  tier: SubscriptionTier;
  price: string;
  features: string[];
}[] = [
  {
    tier: 'free',
    price: 'Free',
    features: [
      'Track expenses & income',
      'Basic budgets',
      'Up to 3 savings goals',
      'Tax summary',
      'Standard categories',
    ],
  },
  {
    tier: 'diamond',
    price: '$4.99/month',
    features: [
      'Everything in Free',
      'Family members (up to 5)',
      'File attachments',
      'Multi-currency support',
      'Advanced tax deductions',
      'Unlimited savings goals',
      'Investment accounts',
    ],
  },
  {
    tier: 'platinum',
    price: '$9.99/month',
    features: [
      'Everything in Diamond',
      'Family members (unlimited)',
      'Priority support',
      'Advanced reports',
      'Data export',
      'Custom tax categories',
      'Early access to new features',
    ],
  },
];

export default function SubscriptionScreen() {
  const { profile, saveProfile } = useUserProfile();
  const currentTier = profile?.subscriptionTier ?? 'free';

  function handleUpgrade(tier: SubscriptionTier) {
    Alert.alert(
      'Upgrade Plan',
      `Switch to ${SUBSCRIPTION_TIERS[tier].label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            await saveProfile({ subscriptionTier: tier });
            Alert.alert('Success', `Upgraded to ${SUBSCRIPTION_TIERS[tier].label}!`);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Choose the plan that works for you</Text>
        </View>

        {PLANS.map(plan => {
          const info = SUBSCRIPTION_TIERS[plan.tier];
          const isCurrent = currentTier === plan.tier;
          return (
            <View key={plan.tier} style={[styles.planCard, isCurrent && styles.planCardActive]}>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current Plan</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planEmoji}>{info.emoji}</Text>
                <View style={styles.planTitleGroup}>
                  <Text style={styles.planName}>{info.label}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
              </View>
              <View style={styles.featuresList}>
                {plan.features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {!isCurrent && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: info.color }]}
                  onPress={() => handleUpgrade(plan.tier)}
                >
                  <Text style={styles.upgradeBtnText}>
                    {plan.tier === 'free' ? 'Downgrade' : `Upgrade to ${info.label}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 24 },
  title: { fontSize: 28, fontWeight: '800', color: 'white' },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 6 },
  planCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  planCardActive: { borderColor: '#7C3AED', borderWidth: 2 },
  currentBadge: {
    alignSelf: 'flex-start', marginBottom: 12,
    backgroundColor: '#7C3AED22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  currentBadgeText: { color: '#A78BFA', fontSize: 11, fontWeight: '600' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planEmoji: { fontSize: 32 },
  planTitleGroup: {},
  planName: { color: 'white', fontSize: 20, fontWeight: '800' },
  planPrice: { color: '#64748B', fontSize: 13, marginTop: 2 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureCheck: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  featureText: { flex: 1, color: '#94A3B8', fontSize: 14, lineHeight: 20 },
  upgradeBtn: {
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  upgradeBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
