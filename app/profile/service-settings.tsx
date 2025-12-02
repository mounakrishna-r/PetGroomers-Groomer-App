import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { formatPrice } from '../../utils/currency';
import GroomerAPI from '../../services/GroomerAPI';
import { useAuth } from '../../components/AuthContext';

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  estimatedDurationMinutes: number;
  category: string;
  petType: string;
  countryCode: string;
  serviceId?: string;
  iconName?: string;
  tasks?: string; // Comma-separated tasks
  commissionPercentage?: number; // Groomer's commission (e.g., 70.0)
  isActive?: boolean;
}

export default function ServiceSettingsScreen() {
  const { groomer } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('IN'); // Default to India
  const [avgCommission, setAvgCommission] = useState<number>(70);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // First, get groomer profile to get country code
      const profileResponse = await GroomerAPI.getProfile();
      let country = 'IN'; // Default to India
      
      if (profileResponse.success && profileResponse.data?.country) {
        country = profileResponse.data.country;
        setCountryCode(country);
      }

      // Fetch services for groomer's country using GroomerAPI
      const servicesResponse = await GroomerAPI.getServices(country);
      
      if (servicesResponse.success && servicesResponse.data) {
        setServices(servicesResponse.data);
        
        // Calculate average commission
        const commissions = servicesResponse.data
          .filter((s: Service) => s.commissionPercentage)
          .map((s: Service) => s.commissionPercentage!);
        
        if (commissions.length > 0) {
          const avg = commissions.reduce((a, b) => a + b, 0) / commissions.length;
          setAvgCommission(Math.round(avg));
        }
      }
    } catch (error) {
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return Colors.status.completed;
      case 'premium': return Colors.warning;
      case 'specialty': return Colors.primary;
      default: return Colors.text.disabled;
    }
  };

  const renderServiceCard = (service: Service) => (
    <View key={service.id} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(service.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(service.category) }]}>
              {service.category.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatPrice(service.basePrice, service.countryCode)}</Text>
        </View>
      </View>

      <Text style={styles.serviceDescription}>{service.description}</Text>

      {/* Tasks List */}
      {service.tasks && (
        <View style={styles.tasksList}>
          <Text style={styles.tasksTitle}>Tasks included:</Text>
          <View style={styles.tasksContainer}>
            {service.tasks.split(',').map((task, index) => (
              <View key={index} style={styles.taskChip}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.taskText}>{task.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.serviceDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{service.estimatedDurationMinutes} mins</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="paw-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{service.petType}</Text>
        </View>
        {service.commissionPercentage && (
          <View style={styles.detailItem}>
            <Ionicons name="wallet-outline" size={16} color={Colors.status.completed} />
            <Text style={[styles.detailText, { color: Colors.status.completed }]}>
              {service.commissionPercentage}% yours
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoBannerText}>
            Services are managed by the admin. You'll be assigned orders based on these services in your area.
          </Text>
        </View>

        {/* Available Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          <Text style={styles.sectionSubtitle}>
            These are the services customers can book in your region ({countryCode})
          </Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          )}
          
          {!loading && services.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyText}>No services available in your region yet</Text>
              <Text style={styles.emptySubtext}>Contact support to add services</Text>
            </View>
          )}
          
          {!loading && services.map(service => renderServiceCard(service))}
        </View>

        {/* Commission Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Structure</Text>
          <View style={styles.commissionCard}>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Your Commission (Avg)</Text>
              <Text style={styles.commissionValue}>{avgCommission}%</Text>
            </View>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Platform Fee</Text>
              <Text style={styles.commissionValue}>{100 - avgCommission}%</Text>
            </View>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Tax (GST)</Text>
              <Text style={styles.commissionValue}>18%</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>Example Calculation (for {formatPrice(1000, countryCode)} order):</Text>
              <Text style={styles.exampleText}>
                Order Value: {formatPrice(1000, countryCode)}{'\n'}
                Your Commission ({avgCommission}%): {formatPrice(1000 * (avgCommission / 100), countryCode)}{'\n'}
                Platform Fee ({100 - avgCommission}%): -{formatPrice(1000 * ((100 - avgCommission) / 100), countryCode)}{'\n'}
                Tax (18% on platform fee): -{formatPrice(1000 * ((100 - avgCommission) / 100) * 0.18, countryCode)}{'\n'}
                <Text style={styles.exampleHighlight}>
                  Your Net Earnings: {formatPrice(1000 * (avgCommission / 100) - (1000 * ((100 - avgCommission) / 100) * 0.18), countryCode)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoBannerText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  section: {
    margin: Spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  priceContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  priceText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  serviceDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  tasksList: {
    marginBottom: Spacing.sm,
  },
  tasksTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  tasksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  taskText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  commissionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commissionLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  commissionValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  exampleBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exampleTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  exampleText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  exampleHighlight: {
    fontWeight: Typography.weights.bold,
    color: Colors.status.completed,
    fontSize: Typography.sizes.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});
