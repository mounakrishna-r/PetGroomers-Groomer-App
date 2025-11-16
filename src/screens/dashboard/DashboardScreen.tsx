import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GroomerAPI from '../../services/GroomerAPI';

interface DashboardStats {
  totalEarnings: number;
  completedOrders: number;
  averageRating: number;
  pendingOrders: number;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    completedOrders: 0,
    averageRating: 0,
    pendingOrders: 0,
  });
  const [groomerName, setGroomerName] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await GroomerAPI.initialize();
      
      // Get groomer data
      const groomer = await GroomerAPI.getStoredGroomerData();
      if (groomer) {
        setGroomerName(groomer.name);
        setIsAvailable(groomer.isAvailable);
      }

      // Get earnings stats
      const earningsData = await GroomerAPI.getEarnings('month');
      setStats({
        totalEarnings: earningsData.totalEarnings,
        completedOrders: earningsData.completedOrders,
        averageRating: earningsData.averageRating,
        pendingOrders: 0, // This would come from orders API
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      const response = await GroomerAPI.updateAvailability(newAvailability);
      
      if (response.success) {
        setIsAvailable(newAvailability);
        Alert.alert(
          'Status Updated',
          `You are now ${newAvailability ? 'available' : 'unavailable'} for new orders.`
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = '#f97316' 
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color?: string; 
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.groomerName}>{groomerName || 'Groomer'}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.availabilityButton,
            { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }
          ]}
          onPress={toggleAvailability}
        >
          <Ionicons 
            name={isAvailable ? 'checkmark-circle' : 'close-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.availabilityText}>
            {isAvailable ? 'Available' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Monthly Earnings"
          value={`₹${stats.totalEarnings.toLocaleString()}`}
          icon="wallet"
          color="#10B981"
        />
        <StatCard
          title="Orders Completed"
          value={stats.completedOrders}
          icon="checkmark-done"
          color="#3B82F6"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          icon="star"
          color="#F59E0B"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon="time"
          color="#EF4444"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="notifications" size={24} color="#f97316" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Available Orders</Text>
            <Text style={styles.actionSubtitle}>Find new grooming requests nearby</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="list" size={24} color="#f97316" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Orders</Text>
            <Text style={styles.actionSubtitle}>Check your assigned orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="bar-chart" size={24} color="#f97316" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Earnings Report</Text>
            <Text style={styles.actionSubtitle}>View detailed earnings breakdown</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Success</Text>
        
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Keep your availability status updated to receive more order requests
          </Text>
        </View>
        
        <View style={styles.tipCard}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Provide excellent service to maintain high ratings and get more customers
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  groomerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  availabilityText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});