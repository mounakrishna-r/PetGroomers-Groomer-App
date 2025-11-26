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
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Order, Groomer } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import { useAuth } from '../../components/AuthContext';

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { groomer } = useAuth();

  // Load available orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAvailableOrders();
    }, [])
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to see nearby orders'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      if (location && groomer?.serviceRadius) {
        // Load orders with radius filtering
        const response = await GroomerAPI.getAvailableOrdersWithRadius(
          location.coords.latitude,
          location.coords.longitude,
          groomer.serviceRadius
        );
        
        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          console.error('Failed to load orders:', response.error);
        }
      } else {
        // Load all available orders
        const response = await GroomerAPI.getAvailableOrders();
        
        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          console.error('Failed to load orders:', response.error);
        }
      }
    } catch (error) {
      console.error('Load available orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAvailableOrders();
  };

  const handleAcceptOrder = async (orderId: number) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response = await GroomerAPI.acceptOrder(orderId);
              if (response.success) {
                Alert.alert('Success', 'Order accepted successfully!');
                loadAvailableOrders(); // Refresh the list
              } else {
                Alert.alert('Error', response.error || 'Failed to accept order');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error occurred');
            }
          },
        },
      ]
    );
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

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1 
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleSection}>
          <Text style={styles.orderTitle}>New Order</Text>
          <Text style={styles.orderService}>{item.serviceName}</Text>
          {/* Prominent Date Display */}
          {(item.preferredDate || item.scheduledDateTime) && (
            <View style={styles.dateChip}>
              <Ionicons name="calendar" size={12} color={Colors.surface} />
              <Text style={styles.dateChipText}>
                {item.preferredDate 
                  ? formatDate(item.preferredDate).split(',')[0] // Show just the date part
                  : item.scheduledDateTime 
                  ? formatDate(item.scheduledDateTime).split(',')[0]
                  : 'ASAP'
                }
              </Text>
            </View>
          )}
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>${item.servicePrice}</Text>
          {item.distanceFromGroomer && (
            <Text style={styles.distanceText}>
              {formatDistance(item.distanceFromGroomer)}
            </Text>
          )}
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
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
        </View>
        {/* Scheduling Information */}
        {(item.preferredDate || item.scheduledDateTime) && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {item.preferredDate 
                ? `Preferred: ${formatDate(item.preferredDate)}` 
                : item.scheduledDateTime 
                ? `Scheduled: ${formatDate(item.scheduledDateTime)}`
                : 'ASAP'
              }
            </Text>
          </View>
        )}
        {item.preferredTime && (
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>Preferred Time: {item.preferredTime}</Text>
          </View>
        )}
        {item.specialNotes && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{item.specialNotes}</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item.id)}
        >
          <LinearGradient colors={Colors.gradients.secondary} style={styles.acceptButtonGradient}>
            <Ionicons name="checkmark" size={16} color={Colors.surface} />
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Service Radius Info */}
      {groomer?.serviceRadius && (
        <View style={styles.radiusInfo}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.radiusText}>
            Showing orders within {groomer.serviceRadius}km of your location
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <LinearGradient colors={Colors.gradients.secondary} style={styles.header}>
        <Text style={styles.headerTitle}>Available Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} available nearby
        </Text>
      </LinearGradient>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyText}>No orders available</Text>
            <Text style={styles.emptySubtext}>
              {groomer?.serviceRadius 
                ? `No orders found within ${groomer.serviceRadius}km of your location. Try increasing your service radius in Profile settings.`
                : 'Pull down to refresh or check your internet connection'
              }
            </Text>
          </View>
        }
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
  radiusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue.light + '20',
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  radiusText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
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
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderTitleSection: {
    flex: 1,
  },
  orderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  orderService: {
    fontSize: Typography.sizes.md,
    color: Colors.secondary,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  dateChipText: {
    color: Colors.surface,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  distanceText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
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
  acceptButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  acceptButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
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
    lineHeight: 20,
  },
});