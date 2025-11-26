import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Order } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import ServiceOTPModal from '../../components/ui/ServiceOTPModal';

type OrderFilter = 'all' | 'assigned' | 'in_progress' | 'completed';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpType, setOtpType] = useState<'start' | 'complete'>('start');

  // Load orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      const response = await GroomerAPI.getAssignedOrders();
      if (response.success && response.data) {
        setOrders(response.data);
        filterOrders(response.data, activeFilter);
      } else {
        console.error('Failed to load orders:', response.error);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filterOrders = (orderList: Order[], filter: OrderFilter) => {
    let filtered = orderList;
    
    switch (filter) {
      case 'assigned':
        filtered = orderList.filter(order => 
          order.status === 'ASSIGNED' || order.status === 'CONFIRMED'
        );
        break;
      case 'in_progress':
        filtered = orderList.filter(order => order.status === 'IN_PROGRESS');
        break;
      case 'completed':
        filtered = orderList.filter(order => order.status === 'COMPLETED');
        break;
      default:
        filtered = orderList;
    }
    
    setFilteredOrders(filtered);
  };

  const handleFilterChange = (filter: OrderFilter) => {
    setActiveFilter(filter);
    filterOrders(orders, filter);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return Colors.status.pending;
      case 'CONFIRMED':
      case 'ASSIGNED':
        return Colors.status.assigned;
      case 'IN_PROGRESS':
        return Colors.status.inProgress;
      case 'COMPLETED':
        return Colors.status.completed;
      case 'CANCELLED':
        return Colors.status.cancelled;
      default:
        return Colors.text.disabled;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'ASSIGNED':
        return 'Assigned';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleStartService = (order: Order) => {
    setSelectedOrder(order);
    setOtpType('start');
    setOtpModalVisible(true);
  };

  const handleCompleteService = (order: Order) => {
    setSelectedOrder(order);
    setOtpType('complete');
    setOtpModalVisible(true);
  };

  const handleOTPSuccess = () => {
    setOtpModalVisible(false);
    setSelectedOrder(null);
    loadOrders(); // Refresh orders after status change
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderTitle}>Order #{item.id}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>${item.servicePrice}</Text>
        </View>
      </View>

      {/* Customer & Pet Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{item.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{item.customerPhone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="paw" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            {item.petName} ({item.petType})
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cut" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{item.serviceName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
        </View>
        {item.preferredDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{formatDate(item.preferredDate)}</Text>
          </View>
        )}
        {item.specialNotes && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{item.specialNotes}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {item.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStartService(item)}
          >
            <LinearGradient colors={Colors.gradients.success} style={styles.actionButtonGradient}>
              <Ionicons name="play" size={16} color={Colors.surface} />
              <Text style={styles.actionButtonText}>Start Service</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {item.status === 'IN_PROGRESS' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCompleteService(item)}
          >
            <LinearGradient colors={Colors.gradients.primary} style={styles.actionButtonGradient}>
              <Ionicons name="checkmark" size={16} color={Colors.surface} />
              <Text style={styles.actionButtonText}>Complete Service</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {item.status === 'COMPLETED' && item.serviceEndTime && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.status.completed} />
            <Text style={styles.completedText}>
              Completed {formatDate(item.serviceEndTime)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All Orders' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'completed', label: 'Completed' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            activeFilter === filter.key && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange(filter.key as OrderFilter)}
        >
          <Text style={[
            styles.filterButtonText,
            activeFilter === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <LinearGradient colors={Colors.gradients.primary} style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </Text>
      </LinearGradient>

      {/* Filters */}
      {renderFilters()}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'No orders found' 
                : `No ${activeFilter.replace('_', ' ')} orders`
              }
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or check the Available tab for new orders
            </Text>
          </View>
        }
      />

      {/* OTP Modal */}
      <ServiceOTPModal
        visible={otpModalVisible}
        order={selectedOrder}
        type={otpType}
        onSuccess={handleOTPSuccess}
        onCancel={() => setOtpModalVisible(false)}
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
    backgroundColor: Colors.primary,
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
  listContainer: {
    padding: Spacing.md,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  priceContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  priceText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    paddingTop: Spacing.md,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.xs,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  completedText: {
    color: Colors.status.completed,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.disabled,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});