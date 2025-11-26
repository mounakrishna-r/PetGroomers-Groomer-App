import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../components/AuthContext';
import { GroomerProfile } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import RadiusSettingsModal from '../../components/ui/RadiusSettingsModal';

export default function ProfileScreen() {
  const { groomer, logout } = useAuth();
  const [profile, setProfile] = useState<GroomerProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [serviceRadius, setServiceRadius] = useState(15);
  const [isEditingRadius, setIsEditingRadius] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await GroomerAPI.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        setIsOnline(response.data.isOnline);
        setServiceRadius(response.data.serviceRadius || 15);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleOnlineToggle = async (value: boolean) => {
    try {
      const response = await GroomerAPI.updateOnlineStatus(value);
      if (response.success) {
        setIsOnline(value);
      }
    } catch (error) {
      console.error('Update online status error:', error);
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const handleRadiusUpdate = async (newRadius: number) => {
    try {
      const response = await GroomerAPI.updateServiceRadius(newRadius);
      if (response.success) {
        setServiceRadius(newRadius);
        setIsEditingRadius(false);
      }
    } catch (error) {
      console.error('Update radius error:', error);
      Alert.alert('Error', 'Failed to update service radius');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🔄 Starting logout process from profile screen...');
              await logout();
              console.log('✅ Logout successful - auth state should be updated');
              
              // Force navigation as a fallback (the index.tsx should handle this automatically)
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 100);
              
            } catch (error) {
              console.error('❌ Logout failed:', error);
              Alert.alert(
                'Logout Error', 
                'Failed to log out completely. Please try again or restart the app.',
                [
                  { text: 'Try Again', onPress: () => handleLogout() },
                  { text: 'Force Logout', onPress: () => router.replace('/(auth)/login') }
                ]
              );
            }
          }
        },
      ]
    );
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : 'New';
  };

  const renderProfileHeader = () => (
    <LinearGradient colors={Colors.gradients.warm} style={styles.header}>
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={Colors.surface} />
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{profile?.name || groomer?.name || 'Groomer'}</Text>
          <Text style={styles.profilePhone}>{profile?.phone || groomer?.phone}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text style={styles.ratingText}>
              {formatRating(profile?.averageRating || 0)}
            </Text>
            <Text style={styles.reviewCount}>
              ({profile?.totalReviews || 0} reviews)
            </Text>
          </View>
        </View>
      </View>
      
      {/* Online Status Toggle */}
      <View style={styles.statusToggle}>
        <Text style={styles.statusLabel}>Available for Orders</Text>
        <Switch
          value={isOnline}
          onValueChange={handleOnlineToggle}
          trackColor={{ false: Colors.surface + '50', true: Colors.primary + '50' }}
          thumbColor={isOnline ? Colors.primary : Colors.surface}
        />
      </View>
    </LinearGradient>
  );

  const renderServiceArea = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Service Area</Text>
      
      <TouchableOpacity
        style={styles.radiusCard}
        onPress={() => setIsEditingRadius(true)}
      >
        <View style={styles.radiusInfo}>
          <Ionicons name="location-outline" size={24} color={Colors.primary} />
          <View style={styles.radiusText}>
            <Text style={styles.radiusLabel}>Service Radius</Text>
            <Text style={styles.radiusValue}>{serviceRadius} km</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
      </TouchableOpacity>
      
      <View style={styles.radiusIndicator}>
        <View style={styles.radiusBar}>
          <View
            style={[
              styles.radiusProgress,
              { 
                width: `${(serviceRadius / 100) * 100}%`,
                backgroundColor: 
                  serviceRadius <= 25 ? Colors.status.completed :
                  serviceRadius <= 50 ? Colors.warning :
                  Colors.error
              }
            ]}
          />
        </View>
        <Text style={styles.radiusDescription}>
          {serviceRadius <= 25 ? 'Local area coverage' :
           serviceRadius <= 50 ? 'Wide coverage area' :
           'Maximum coverage area'}
        </Text>
      </View>
    </View>
  );

  const renderAccountActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      
      <TouchableOpacity
        style={styles.actionItem}
        onPress={() => router.push('/profile/edit-profile')}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="person-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Edit Profile</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionItem}
        onPress={() => router.push('/profile/service-settings')}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="settings-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Service Settings</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionItem}
        onPress={() => router.push('/profile/payment-settings')}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="card-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Payment Settings</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionItem}
        onPress={() => router.push('/profile/help-support')}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionText}>Help & Support</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.disabled} />
      </TouchableOpacity>
    </View>
  );

  const handleTestLogout = async () => {
    try {
      console.log('🧪 Testing AsyncStorage functionality...');
      const testResult = await GroomerAPI.testAsyncStorage();
      
      if (testResult) {
        Alert.alert('Test Success', 'AsyncStorage is working correctly. Logout should work.');
        
        // Test the actual logout function
        console.log('🧪 Testing actual logout...');
        await logout();
        console.log('✅ Logout test completed');
      } else {
        Alert.alert('Test Failed', 'AsyncStorage is not working properly. This explains the logout issue.');
      }
    } catch (error) {
      console.error('🧪 Test failed:', error);
      Alert.alert('Test Error', `Test failed: ${error}`);
    }
  };

  const renderDangerZone = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Management</Text>
      
      {/* Debug Test Button - Remove in production */}
      <TouchableOpacity
        style={[styles.actionItem]}
        onPress={handleTestLogout}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="bug-outline" size={24} color={Colors.warning} />
          <Text style={[styles.actionText, { color: Colors.warning }]}>Test Logout Function</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionItem, styles.dangerItem]}
        onPress={handleLogout}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={[styles.actionText, styles.dangerText]}>Log Out</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Profile Header */}
      {renderProfileHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.warning]}
            tintColor={Colors.warning}
          />
        }
      >
        {/* Service Area Settings */}
        {renderServiceArea()}

        {/* Account Actions */}
        {renderAccountActions()}

        {/* Danger Zone */}
        {renderDangerZone()}
      </ScrollView>

      {/* Radius Settings Modal */}
      <RadiusSettingsModal
        visible={isEditingRadius}
        currentRadius={serviceRadius}
        onClose={() => setIsEditingRadius(false)}
        onSave={handleRadiusUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  profilePhone: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.surface,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  reviewCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.surface,
    opacity: 0.8,
  },
  statusToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statusLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.surface,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  radiusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  radiusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusText: {
    marginLeft: Spacing.sm,
  },
  radiusLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  radiusValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  radiusIndicator: {
    marginTop: Spacing.sm,
  },
  radiusBar: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  radiusProgress: {
    height: '100%',
    borderRadius: 3,
  },
  radiusDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.disabled,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: Colors.error,
  },
});