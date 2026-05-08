import { Linking, View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '../../lib/types';

const WEB_APP_URL = 'https://expense-tracker-9e457.web.app';

const PLANS: {
  tier: SubscriptionTier;
  price: string;
  features: string[];
  color: string;
}[] = [
  {
    tier: 'free',
    price: 'Free forever',
    color: '#6B7280',
    features: [
      'Track expenses & income',
      'Basic budgets & savings goals',
      'Tax summary (ATO deductions)',
      'Loans & trip planner',
      'Standard categories',
    ],
  },
  {
    tier: 'diamond',
    price: '$4.99 / month',
    color: '#3B82F6',
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
    price: '$9.99 / month',
    color: '#8B5CF6',
    features: [
      'Everything in Diamond',
      'Family members (unlimited)',
      'Priority support',
      'Advanced reports & data export',
      'Custom tax categories',
      'Early access to new features',
    ],
  },
];

export default function SubscriptionScreen() {
  const { profile, saveProfile } = useUserProfile();
  const currentTier = profile?.subscriptionTier ?? 'free';

  function handleChangePlan(tier: SubscriptionTier) {
    const isUpgrade = tier !== 'free';
    Alert.alert(
      isUpgrade ? `Upgrade to ${SUBSCRIPTION_TIERS[tier].label}` : 'Switch to Free',
      isUpgrade
        ? `This will switch your plan to ${SUBSCRIPTION_TIERS[tier].label} (${PLANS.find(p => p.tier === tier)?.price}). You can also manage billing on the web app.`
        : 'Switch back to the free plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isUpgrade ? 'Confirm Upgrade' : 'Confirm',
          onPress: async () => {
            await saveProfile({ subscriptionTier: tier });
            Alert.alert('Plan updated', `You are now on the ${SUBSCRIPTION_TIERS[tier].label} plan.`);
          },
        },
        ...(isUpgrade ? [{
          text: 'Manage on Web',
          onPress: () => Linking.openURL(`${WEB_APP_URL}/subscription`),
        }] : []),
      ]
    );
  }

  function openWebApp() {
    Linking.openURL(`${WEB_APP_URL}/subscription`).catch(() =>
      Alert.alert('Could not open browser')
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Choose the plan that works for you</Text>
        </View>

        {/* Web app management banner */}
        <TouchableOpacity style={styles.webBanner} onPress={openWebApp} activeOpacity={0.8}>
          <View style={styles.webBannerLeft}>
            <Text style={styles.webBannerIcon}>🌐</Text>
            <View>
              <Text style={styles.webBannerTitle}>Manage billing on the web</Text>
              <Text style={styles.webBannerSub}>Full subscription management at expense-tracker-9e457.web.app</Text>
            </View>
          </View>
          <Text style={styles.webBannerArrow}>→</Text>
        </TouchableOpacity>

        {PLANS.map(plan => {
          const info = SUBSCRIPTION_TIERS[plan.tier];
          const isCurrent = currentTier === plan.tier;
          const isHigher = plan.tier === 'platinum' || (plan.tier === 'diamond' && currentTier === 'free');
          return (
            <View key={plan.tier} style={[styles.planCard, isCurrent && { borderColor: plan.color, borderWidth: 2 }]}>
              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: plan.color + '22' }]}>
                  <Text style={[styles.currentBadgeText, { color: plan.color }]}>✓ Current Plan</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planEmoji}>{info.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{info.label}</Text>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                </View>
              </View>
              <View style={styles.featuresList}>
                {plan.features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {!isCurrent && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: plan.color }]}
                  onPress={() => handleChangePlan(plan.tier)}
                >
                  <Text style={styles.upgradeBtnText}>
                    {plan.tier === 'free' ? 'Switch to Free' : `Upgrade to ${info.label}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.webLink} onPress={openWebApp}>
          <Text style={styles.webLinkText}>Open web app for full billing management →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 28, fontWeight: '800', color: 'white' },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 6 },
  webBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#3B82F6',
  },
  webBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  webBannerIcon: { fontSize: 24 },
  webBannerTitle: { color: 'white', fontSize: 14, fontWeight: '700' },
  webBannerSub: { color: '#93C5FD', fontSize: 11, marginTop: 2 },
  webBannerArrow: { color: '#3B82F6', fontSize: 20, fontWeight: '700' },
  planCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  currentBadge: {
    alignSelf: 'flex-start', marginBottom: 12,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  currentBadgeText: { fontSize: 12, fontWeight: '700' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planEmoji: { fontSize: 32 },
  planName: { color: 'white', fontSize: 20, fontWeight: '800' },
  planPrice: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureCheck: { fontSize: 14, fontWeight: '700' },
  featureText: { flex: 1, color: '#94A3B8', fontSize: 14, lineHeight: 20 },
  upgradeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  webLink: { alignItems: 'center', paddingVertical: 16 },
  webLinkText: { color: '#60A5FA', fontSize: 13, fontWeight: '500' },
});
