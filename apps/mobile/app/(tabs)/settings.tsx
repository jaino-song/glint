import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '@/lib/auth/auth-provider';
import { useRewardedAd } from '@/hooks/ads';
import { useAds } from '@/components/ads';
import { Button } from '@/components/common';
import type { Plan, PLAN_LIMITS } from '@glint/types';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { shouldShowAds } = useAds();
  const { isLoaded: rewardedLoaded, show: showRewarded } = useRewardedAd({
    onRewarded: (reward) => {
      Alert.alert(
        'Premium Activated!',
        `You've earned ${reward.amount} hours of ad-free experience!`
      );
    },
  });

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleWatchAd = async () => {
    const shown = await showRewarded();
    if (!shown) {
      Alert.alert('Unavailable', 'No reward video available right now. Try again later.');
    }
  };

  const handleUpgrade = () => {
    Alert.alert('Coming Soon', 'In-app purchases will be available soon!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Plan Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.card}>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{profile?.plan || 'FREE'}</Text>
            </View>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Credits</Text>
            <Text style={styles.planValue}>{profile?.credits ?? 0}</Text>
          </View>
          {profile?.plan === 'FREE' && (
            <Button onPress={handleUpgrade} style={styles.upgradeButton}>
              Upgrade to Pro
            </Button>
          )}
        </View>
      </View>

      {/* Ad-Free Section (Only for FREE users) */}
      {shouldShowAds && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Go Ad-Free</Text>
          <View style={styles.card}>
            <Text style={styles.adFreeText}>
              Watch a short video to enjoy 24 hours without ads!
            </Text>
            <Button
              onPress={handleWatchAd}
              variant="secondary"
              disabled={!rewardedLoaded}
              style={styles.watchAdButton}
            >
              {rewardedLoaded ? 'Watch Video' : 'Loading...'}
            </Button>
          </View>
        </View>
      )}

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Email Notifications</Text>
            <Switch
              value={profile?.notificationEmail ?? false}
              onValueChange={() => Alert.alert('Coming Soon', 'This feature is coming soon!')}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={profile?.notificationEmail ? '#6366f1' : '#9ca3af'}
            />
          </View>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Push Notifications</Text>
            <Switch
              value={profile?.notificationPush ?? false}
              onValueChange={() => Alert.alert('Coming Soon', 'This feature is coming soon!')}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={profile?.notificationPush ? '#6366f1' : '#9ca3af'}
            />
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Terms of Service</Text>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <Button onPress={handleSignOut} variant="outline" style={styles.signOutButton}>
          Sign Out
        </Button>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  planLabel: {
    fontSize: 16,
    color: '#374151',
  },
  planBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  planValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  upgradeButton: {
    marginTop: 12,
  },
  adFreeText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  watchAdButton: {
    marginTop: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#374151',
  },
  aboutValue: {
    fontSize: 16,
    color: '#9ca3af',
  },
  chevron: {
    fontSize: 18,
    color: '#9ca3af',
  },
  signOutButton: {
    borderColor: '#ef4444',
  },
  footer: {
    height: 40,
  },
});
