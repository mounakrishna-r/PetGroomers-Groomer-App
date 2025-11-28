import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { EarningsData, EarningsHistory } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import { formatPrice } from '../../utils/currency';

type EarningsPeriod = 'today' | 'week' | 'month';

export default function EarningsScreen() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState<EarningsPeriod>('today');

  // Load earnings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEarningsData();
    }, [activePeriod])
  );

  const loadEarningsData = async () => {
    try {
      const [earningsResponse, historyResponse] = await Promise.all([
        GroomerAPI.getEarnings(activePeriod),
        GroomerAPI.getEarningsHistory()
      ]);

      if (earningsResponse.success && earningsResponse.data) {
        setEarningsData(earningsResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setEarningsHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Load earnings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarningsData();
  };

  const handlePeriodChange = (period: EarningsPeriod) => {
    setActivePeriod(period);
    setLoading(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodLabel = (period: EarningsPeriod) => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return period;
    }
  };

  const renderEarningsCard = () => (
    <View style={styles.earningsCard}>
      <LinearGradient colors={Colors.gradients.warm} style={styles.earningsGradient}>
        <View style={styles.earningsContent}>
          <View style={styles.earningsHeader}>
            <Ionicons name="wallet" size={24} color={Colors.surface} />
            <Text style={styles.earningsTitle}>Total Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>
            {formatPrice(earningsData?.totalEarnings || 0, 'IN')}
          </Text>
          <Text style={styles.earningsPeriod}>
            {getPeriodLabel(activePeriod)}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsRow = () => (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Ionicons name="checkmark-circle" size={24} color={Colors.status.completed} />
        <Text style={styles.statNumber}>{earningsData?.completedOrders || 0}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="star" size={24} color={Colors.warning} />
        <Text style={styles.statNumber}>
          {earningsData?.averageRating ? earningsData.averageRating.toFixed(1) : '0.0'}
        </Text>
        <Text style={styles.statLabel}>Avg Rating</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="trending-up" size={24} color={Colors.primary} />
        <Text style={styles.statNumber}>
          {earningsData?.completedOrders 
            ? formatPrice((earningsData.totalEarnings || 0) / earningsData.completedOrders, 'IN')
            : formatPrice(0, 'IN')
          }
        </Text>
        <Text style={styles.statLabel}>Avg/Order</Text>
      </View>
    </View>
  );

  const renderPeriodFilters = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            activePeriod === filter.key && styles.filterButtonActive
          ]}
          onPress={() => handlePeriodChange(filter.key as EarningsPeriod)}
        >
          <Text style={[
            styles.filterButtonText,
            activePeriod === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHistoryItem = ({ item }: { item: EarningsHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyCustomer}>{item.customerName}</Text>
          <Text style={styles.historyService}>{item.serviceName}</Text>
        </View>
        <Text style={styles.historyAmount}>{formatPrice(item.amount, 'IN')}</Text>
      </View>
      <Text style={styles.historyDate}>{formatDate(item.completedAt)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <LinearGradient colors={Colors.gradients.warm} style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <Text style={styles.headerSubtitle}>Track your business performance</Text>
      </LinearGradient>

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
        {/* Period Filters */}
        {renderPeriodFilters()}

        {/* Earnings Summary */}
        {renderEarningsCard()}

        {/* Stats Row */}
        {renderStatsRow()}

        {/* Earnings History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Earnings</Text>
          
          {earningsHistory.length > 0 ? (
            <FlatList
              data={earningsHistory.slice(0, 10)} // Show last 10 transactions
              keyExtractor={(item) => `${item.orderId}-${item.completedAt}`}
              renderItem={renderHistoryItem}
              scrollEnabled={false}
              style={styles.historyList}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyHistoryText}>No earnings history yet</Text>
              <Text style={styles.emptyHistorySubtext}>
                Complete your first service to see earnings history
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: Typography.sizes.title,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.warning,
  },
  filterButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.surface,
    fontWeight: Typography.weights.semibold,
  },
  earningsCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  earningsGradient: {
    padding: Spacing.lg,
  },
  earningsContent: {
    alignItems: 'center',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  earningsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
    marginLeft: Spacing.xs,
  },
  earningsAmount: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  earningsPeriod: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  historySection: {
    paddingHorizontal: Spacing.md,
  },
  historyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  historyList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  historyItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  historyCustomer: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  historyService: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  historyAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  historyDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.disabled,
  },
  emptyHistory: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyHistorySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.disabled,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});