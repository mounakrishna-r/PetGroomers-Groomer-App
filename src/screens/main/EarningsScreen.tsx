import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Groomer, Order } from '../../types';
import { GroomerAPI } from '../../services/api';

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  completedOrders: number;
  averageOrderValue: number;
  recentTransactions: Order[];
}

export default function EarningsScreen() {
  const [groomer, setGroomer] = useState<Groomer | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const groomerData = await GroomerAPI.getStoredGroomerData();
      setGroomer(groomerData);
      
      if (groomerData?.id) {
        // Load earnings data - this would come from your API
        await loadEarningsData(groomerData.id);
      }
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEarningsData = async (groomerId: number) => {
    try {
      // This is mock data - replace with actual API call
      const mockEarnings: EarningsData = {
        totalEarnings: 45230,
        todayEarnings: 850,
        weeklyEarnings: 4200,
        monthlyEarnings: 18500,
        completedOrders: 127,
        averageOrderValue: 356,
        recentTransactions: [
          {
            id: 1,
            customerName: 'Raj Kumar',
            customerPhone: '+91-9876543210',
            petName: 'Bruno',
            petType: 'Dog',
            serviceName: 'Full Grooming',
            servicePrice: 800,
            status: 'COMPLETED' as const,
            createdAt: '2024-01-15T10:30:00Z',
            address: 'Koramangala, Bangalore',
          },
          {
            id: 2,
            customerName: 'Priya Sharma',
            customerPhone: '+91-8765432109',
            petName: 'Whiskers',
            petType: 'Cat',
            serviceName: 'Bath & Brush',
            servicePrice: 450,
            status: 'COMPLETED' as const,
            createdAt: '2024-01-15T08:15:00Z',
            address: 'Indiranagar, Bangalore',
          },
        ],
      };
      
      setEarningsData(mockEarnings);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCurrentEarnings = () => {
    switch (selectedPeriod) {
      case 'today':
        return earningsData.todayEarnings;
      case 'week':
        return earningsData.weeklyEarnings;
      case 'month':
        return earningsData.monthlyEarnings;
      default:
        return earningsData.weeklyEarnings;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['today', 'week', 'month'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const EarningsCard = () => (
    <LinearGradient
      colors={['#f97316', '#ea580c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.earningsCard}
    >
      <Text style={styles.earningsLabel}>
        {selectedPeriod === 'today' ? "Today's Earnings" : 
         selectedPeriod === 'week' ? "This Week's Earnings" : 
         "This Month's Earnings"}
      </Text>
      <Text style={styles.earningsAmount}>₹{getCurrentEarnings().toLocaleString('en-IN')}</Text>
      <View style={styles.earningsStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{earningsData.completedOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{earningsData.averageOrderValue}</Text>
          <Text style={styles.statLabel}>Avg. Value</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const TransactionItem = ({ order }: { order: Order }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{order.serviceName}</Text>
        <Text style={styles.transactionSubtitle}>
          {order.customerName} • {order.petName}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(order.createdAt)}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={styles.amountText}>+₹{order.servicePrice}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f97316']}
          tintColor="#f97316"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <Text style={styles.headerSubtitle}>Track your income and performance</Text>
      </View>

      {/* Period Selector */}
      <PeriodSelector />

      {/* Main Earnings Card */}
      <View style={styles.content}>
        <EarningsCard />

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>₹{earningsData.totalEarnings.toLocaleString('en-IN')}</Text>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{earningsData.completedOrders}</Text>
              <Text style={styles.summaryLabel}>Orders Completed</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionsList}>
            {earningsData.recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} order={transaction} />
            ))}
          </View>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  periodButtonActive: {
    backgroundColor: '#f97316',
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  earningsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  earningsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
});