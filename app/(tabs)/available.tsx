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
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Order, Groomer } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import { useAuth } from '../../components/AuthContext';
import { formatPrice } from '../../utils/currency';

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const { groomer } = useAuth();

  // Load available orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAvailableOrders();
    }, [selectedRadius]) // Reload when radius changes
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Reload orders when location or selected radius changes
    if (location) {
      loadAvailableOrders();
    }
  }, [location, selectedRadius]);

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
      
      // Update groomer's current location in database (like Swiggy)
      if (groomer?.id) {
        try {
          await GroomerAPI.updateCurrentLocation(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
          console.log('✅ Current location updated in database');
        } catch (updateError) {
          console.log('Failed to update location in database:', updateError);
        }
      }
      
      // Get address from coordinates
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          const addressParts = [addr.street, addr.city, addr.region].filter(Boolean);
          setCurrentAddress(addressParts.join(', '));
        }
      } catch (geoError) {
        console.log('Geocoding error:', geoError);
        setCurrentAddress('Location detected');
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      if (location && selectedRadius) {
        console.log('📍 Loading orders with location filter:');
        console.log('  Current location:', location.coords.latitude, location.coords.longitude);
        console.log('  Selected radius:', selectedRadius, 'km');
        
        // Load orders with radius filtering using the selected radius from slider
        const response = await GroomerAPI.getAvailableOrdersWithRadius(
          location.coords.latitude,
          location.coords.longitude,
          selectedRadius
        );
        
        if (response.success && response.data) {
          console.log('✅ Loaded', response.data.length, 'orders within', selectedRadius, 'km');
          response.data.forEach((order, index) => {
            console.log(`  Order ${index + 1}: ${order.serviceName} - ${order.distanceFromGroomer?.toFixed(2)}km away`);
          });
          setOrders(response.data);
        } else {
          console.error('Failed to load orders:', response.error);
        }
      } else {
        console.log('📍 Loading all orders (no location filter)');
        // Load all available orders
        const response = await GroomerAPI.getAvailableOrders();
        
        if (response.success && response.data) {
          console.log('✅ Loaded', response.data.length, 'orders');
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
          <Text style={styles.priceText}>{formatPrice(item.servicePrice, item.countryCode)}</Text>
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
      {/* Premium Location Card */}
      {location && (
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.locationCard}
        >
          <View style={styles.locationTopRow}>
            <View style={styles.locationIconContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.locationIconGradient}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Current Location</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {currentAddress || 'Detecting your location...'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.updateLocationButton} 
              onPress={getCurrentLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-circle" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* Premium Distance Filter */}
      <View style={styles.distanceFilterCard}>
        <View style={styles.filterHeaderRow}>
          <View style={styles.filterIconBadge}>
            <Ionicons name="radio-button-on" size={16} color={Colors.primary} />
          </View>
          <View style={styles.filterHeaderText}>
            <Text style={styles.filterTitle}>Service Radius</Text>
          </View>
          <View style={styles.distanceValueContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.distanceValueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.distanceValueText}>{selectedRadius}</Text>
              <Text style={styles.distanceUnitText}>km</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Premium Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={1}
            value={selectedRadius}
            onValueChange={(value) => setSelectedRadius(value)}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>5km</Text>
            <Text style={styles.sliderLabelText}>60km</Text>
          </View>
        </View>
      </View>

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
  locationCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  locationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  locationIconContainer: {
    marginRight: Spacing.sm,
  },
  locationIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  updateLocationButton: {
    padding: Spacing.xs,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  updateLocationText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  distanceFilterCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  filterIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  filterHeaderText: {
    flex: 1,
  },
  filterTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  filterSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  distanceValueContainer: {
  },
  distanceValueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  distanceValueText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginRight: 2,
  },
  distanceUnitText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
    opacity: 0.9,
  },
  sliderContainer: {
    marginTop: -4,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.disabled,
    fontWeight: Typography.weights.medium,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  refreshText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium,
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  radiusButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  radiusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  radiusButtonTextActive: {
    color: Colors.surface,
    fontWeight: Typography.weights.bold,
  },
});