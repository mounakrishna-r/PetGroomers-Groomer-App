import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Groomer } from '../../types';
import { GroomerAPI } from '../../services/api';
import PetGroomersTheme from '../../constants/petGroomersTheme';

export default function ProfileScreen({ navigation }: any) {
  const [groomer, setGroomer] = useState<Groomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    loadGroomerProfile();
  }, []);

  const loadGroomerProfile = async () => {
    try {
      const groomerData = await GroomerAPI.getStoredGroomerData();
      setGroomer(groomerData);
      setIsAvailable(groomerData?.isAvailable || false);
    } catch (error) {
      console.error('Failed to load groomer profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (value: boolean) => {
    if (!groomer?.id) {
      Alert.alert('Error', 'Groomer information not found. Please login again.');
      return;
    }

    // Don't make API call if the value is already the same
    if (isAvailable === value) {
      console.log('🔄 Availability is already set to:', value);
      return;
    }

    try {
      console.log('🔄 Toggling availability for groomer:', groomer.id, 'from:', isAvailable, 'to:', value);
      
      // Optimistically update the UI
      setIsAvailable(value);
      
      const response = await GroomerAPI.updateAvailability(groomer.id, value);
      console.log('📊 Availability update response:', response);
      
      if (response.success) {
        // Update the groomer data
        const updatedGroomer = { ...groomer, isAvailable: value };
        setGroomer(updatedGroomer);
        await GroomerAPI.storeGroomerData(updatedGroomer);
        
        const statusMessage = value ? 'You are now online and available for orders' : 'You are now offline';
        console.log('✅ Availability updated:', statusMessage);
      } else {
        // Revert the UI change if the API call failed
        setIsAvailable(!value);
        Alert.alert('Error', response.message || 'Failed to update availability status');
      }
    } catch (error) {
      console.error('❌ Toggle availability error:', error);
      // Revert the UI change if there was an error
      setIsAvailable(!value);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate('EditProfile');
  };

  const handleDocuments = () => {
    // Navigate to documents screen
    Alert.alert('Documents', 'Documents management coming soon!');
  };

  const handleRatings = () => {
    // Navigate to ratings screen
    Alert.alert('Ratings', 'Ratings and reviews coming soon!');
  };

  const handleSupport = () => {
    // Navigate to support screen
    Alert.alert('Support', 'Support center coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await GroomerAPI.clearStoredData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color={PetGroomersTheme.primary.main} />
        </View>
        <View>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {groomer?.profileImage ? (
              <Image source={{ uri: groomer.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{groomer?.name || 'Groomer Name'}</Text>
            <Text style={styles.phone}>{groomer?.phoneNumber || groomer?.phone}</Text>
            <Text style={styles.email}>{groomer?.email}</Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityLabel}>Available for Orders</Text>
            <Text style={styles.availabilitySubtext}>
              {isAvailable ? 'You are online and receiving orders' : 'You are offline'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ 
              false: PetGroomersTheme.switch.trackInactive, 
              true: PetGroomersTheme.switch.trackActive 
            }}
            thumbColor={isAvailable ? PetGroomersTheme.switch.thumbActive : PetGroomersTheme.switch.thumbInactive}
            ios_backgroundColor={PetGroomersTheme.switch.trackInactive}
          />
        </View>
      </View>

      {/* Profile Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={handleEditProfile}
          />
          <ProfileItem
            icon="document-text-outline"
            title="Documents"
            subtitle="Manage your documents and certificates"
            onPress={handleDocuments}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="star-outline"
            title="Ratings & Reviews"
            subtitle={`${groomer?.rating || '0.0'} ⭐ (${groomer?.totalReviews || 0} reviews)`}
            onPress={handleRatings}
          />
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groomer?.completedOrders || 0}</Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groomer?.rating || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groomer?.experienceYears || groomer?.experience || 0}</Text>
              <Text style={styles.statLabel}>Years Experience</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={handleSupport}
          />
          <ProfileItem
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PetGroomersTheme.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PetGroomersTheme.background.primary,
  },
  header: {
    backgroundColor: PetGroomersTheme.background.secondary,
    paddingHorizontal: PetGroomersTheme.spacing.lg,
    paddingTop: 60,
    paddingBottom: PetGroomersTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: PetGroomersTheme.border.light,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: PetGroomersTheme.spacing.lg,
  },
  avatarContainer: {
    marginRight: PetGroomersTheme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: PetGroomersTheme.borderRadius.full,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: PetGroomersTheme.borderRadius.full,
    backgroundColor: PetGroomersTheme.background.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: PetGroomersTheme.fontSize.xxl,
    fontWeight: 'bold',
    color: PetGroomersTheme.text.primary,
    marginBottom: 4,
  },
  phone: {
    fontSize: PetGroomersTheme.fontSize.md,
    color: PetGroomersTheme.text.secondary,
    marginBottom: 2,
  },
  email: {
    fontSize: PetGroomersTheme.fontSize.md,
    color: PetGroomersTheme.text.secondary,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PetGroomersTheme.background.input,
    padding: PetGroomersTheme.spacing.md,
    borderRadius: PetGroomersTheme.borderRadius.lg,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: PetGroomersTheme.fontSize.md,
    fontWeight: '600',
    color: PetGroomersTheme.text.primary,
  },
  availabilitySubtext: {
    fontSize: PetGroomersTheme.fontSize.sm,
    color: PetGroomersTheme.text.secondary,
    marginTop: 2,
  },
  section: {
    marginTop: PetGroomersTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: PetGroomersTheme.fontSize.lg,
    fontWeight: 'bold',
    color: PetGroomersTheme.text.primary,
    paddingHorizontal: PetGroomersTheme.spacing.lg,
    marginBottom: PetGroomersTheme.spacing.md,
  },
  sectionContent: {
    backgroundColor: PetGroomersTheme.background.secondary,
    marginHorizontal: PetGroomersTheme.spacing.md,
    borderRadius: PetGroomersTheme.borderRadius.lg,
    padding: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PetGroomersTheme.spacing.md,
    paddingVertical: PetGroomersTheme.spacing.md,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: PetGroomersTheme.borderRadius.md,
    backgroundColor: '#E0F2FE', // Light blue background for PetGroomers theme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PetGroomersTheme.spacing.md,
  },
  profileItemTitle: {
    fontSize: PetGroomersTheme.fontSize.md,
    fontWeight: '600',
    color: PetGroomersTheme.text.primary,
  },
  profileItemSubtitle: {
    fontSize: PetGroomersTheme.fontSize.sm,
    color: PetGroomersTheme.text.secondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: PetGroomersTheme.spacing.md,
    paddingVertical: PetGroomersTheme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: PetGroomersTheme.fontSize.xl,
    fontWeight: 'bold',
    color: PetGroomersTheme.primary.main,
  },
  statLabel: {
    fontSize: PetGroomersTheme.fontSize.xs,
    color: PetGroomersTheme.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
});