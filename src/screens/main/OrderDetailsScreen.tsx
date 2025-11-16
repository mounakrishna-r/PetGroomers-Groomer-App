import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Order, OrderStatus } from '../../types';
import { GroomerAPI } from '../../services/api';

type OrderDetailsRouteProp = RouteProp<{ params: { orderId: number } }, 'params'>;

export default function OrderDetailsScreen() {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const orderData = await GroomerAPI.getOrderDetails(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      const response = await GroomerAPI.updateOrderStatus({
        orderId: order.id,
        status: newStatus,
      });

      if (response.success) {
        setOrder({ ...order, status: newStatus });
        Alert.alert('Success', `Order status updated to ${newStatus}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to update order status');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'CONFIRMED':
        return '#3B82F6';
      case 'ASSIGNED':
        return '#8B5CF6';
      case 'IN_PROGRESS':
        return '#f97316';
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getActionButtons = () => {
    if (!order) return null;

    switch (order.status) {
      case 'ASSIGNED':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f97316' }]}
            onPress={() => updateOrderStatus('IN_PROGRESS')}
          >
            <Text style={styles.actionButtonText}>Start Service</Text>
          </TouchableOpacity>
        );
      case 'IN_PROGRESS':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => updateOrderStatus('COMPLETED')}
          >
            <Text style={styles.actionButtonText}>Complete Service</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Order Info Card */}
      <View style={styles.card}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {order.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.serviceName}>{order.serviceName}</Text>
        <Text style={styles.price}>₹{order.servicePrice}</Text>
        {order.scheduledDateTime && (
          <Text style={styles.scheduledTime}>
            Scheduled: {formatDate(order.scheduledDateTime)}
          </Text>
        )}
      </View>

      {/* Customer Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{order.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{order.customerPhone}</Text>
        </View>
        {order.customerEmail && (
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color="#6B7280" />
            <Text style={styles.detailText}>{order.customerEmail}</Text>
          </View>
        )}
      </View>

      {/* Pet Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pet Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="paw" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{order.petName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailText}>{order.petType}</Text>
        </View>
        {order.petBreed && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Breed:</Text>
            <Text style={styles.detailText}>{order.petBreed}</Text>
          </View>
        )}
      </View>

      {/* Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Address</Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{order.address}</Text>
        </View>
        {order.distance && (
          <Text style={styles.distanceText}>
            {order.distance.toFixed(1)} km from your location
          </Text>
        )}
      </View>

      {/* Special Notes */}
      {order.specialNotes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Notes</Text>
          <Text style={styles.notesText}>{order.specialNotes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {getActionButtons()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 8,
  },
  scheduledTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 60,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  actionContainer: {
    padding: 24,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});