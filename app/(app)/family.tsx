import { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useFamily } from '../../contexts/FamilyContext';
import { Avatar } from '../../components/ui/Avatar';
import { FamilyMemberForm } from '../../components/forms/FamilyMemberForm';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { EmptyState } from '../../components/ui/EmptyState';
import type { FamilyMember } from '../../lib/types';

export default function FamilyScreen() {
  const { members, isLoaded, subscriptionTier, isFamilyEnabled, addMember, updateMember, deleteMember } = useFamily();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  if (!isFamilyEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Family</Text>
        </View>
        <EmptyState
          icon="💎"
          title="Diamond or Platinum required"
          subtitle="Upgrade to Diamond or Platinum to manage family members and split expenses"
        />
      </SafeAreaView>
    );
  }

  async function handleSave(data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingMember) {
      await updateMember(editingMember.id, data);
    } else {
      await addMember(data);
    }
  }

  function handleDelete(member: FamilyMember) {
    Alert.alert('Remove Member', `Remove "${member.name}" from family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMember(member.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor="#7C3AED" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Family</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingMember(null); setShowForm(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>

        {members.length === 0 ? (
          <EmptyState
            icon="👨‍👩‍👧‍👦"
            title="No family members yet"
            subtitle="Add family members to track shared expenses"
            actionTitle="Add Member"
            onAction={() => { setEditingMember(null); setShowForm(true); }}
          />
        ) : (
          members.map(member => (
            <SwipeableRow
              key={member.id}
              rightActions={[
                { label: 'Edit', color: '#4F46E5', onPress: () => { setEditingMember(member); setShowForm(true); }, icon: '✏️' },
                { label: 'Remove', color: '#DC2626', onPress: () => handleDelete(member), icon: '🗑️' },
              ]}
            >
              <TouchableOpacity
                style={styles.memberCard}
                onPress={() => { setEditingMember(member); setShowForm(true); }}
                activeOpacity={0.8}
              >
                <Avatar name={member.name} color={member.avatarColor} size={48} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRel}>{member.relationship ?? 'Other'}</Text>
                  {member.phone && <Text style={styles.memberPhone}>{member.phone}</Text>}
                  {member.dateOfBirth && <Text style={styles.memberDob}>Born: {member.dateOfBirth}</Text>}
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          ))
        )}
      </ScrollView>

      <FamilyMemberForm
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingMember(null); }}
        onSave={handleSave}
        initial={editingMember ?? undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  addBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  sectionLabel: { color: '#64748B', fontSize: 13, marginBottom: 12 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#334155',
  },
  memberInfo: { flex: 1 },
  memberName: { color: 'white', fontSize: 16, fontWeight: '700' },
  memberRel: { color: '#A78BFA', fontSize: 12, fontWeight: '500', marginTop: 2 },
  memberPhone: { color: '#64748B', fontSize: 12, marginTop: 2 },
  memberDob: { color: '#64748B', fontSize: 12, marginTop: 2 },
});
