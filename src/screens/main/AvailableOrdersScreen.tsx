import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, Groomer } from '../../types';
import { GroomerAPI } from '../../services/api';

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [groomer, setGroomer] = useState<Groomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const groomerData = await GroomerAPI.getStoredGroomerData();
      setGroomer(groomerData);
      
      if (groomerData?.id) {
        const ordersData = await GroomerAPI.getAvailableOrders(groomerData.id);
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to load available orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: number) => {
    if (!groomer?.id) return;

    Alert.alert(
      'Accept Order',
      'Do you want to accept this grooming order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await GroomerAPI.acceptOrder({
                orderId,
                groomerId: groomer.id!,
              });

              if (response.success) {
                Alert.alert('Success', 'Order accepted successfully!');
                loadData(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to accept order');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.servicePrice}</Text>
          {item.distance && (
            <Text style={styles.distance}>{item.distance.toFixed(1)} km away</Text>
          )}
        </View>
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.petInfo}>{item.petName} - {item.petType}</Text>
        <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
      </View>

      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptOrder(item.id)}
      >
        <Text style={styles.acceptButtonText}>Accept Order</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No Available Orders</Text>
      <Text style={styles.emptyText}>
        There are no new orders available at the moment. Pull down to refresh.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} nearby
        </Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f97316']}
            tintColor="#f97316"
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  distance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceInfo: {
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  petInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  acceptButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});