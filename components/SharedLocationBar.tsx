import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Colors';
import { useSharedLocation } from './SharedLocationContext';

export default function SharedLocationBar() {
  const { currentLocation, serviceRadius, refreshLocation, updateServiceRadius } = useSharedLocation();
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);
  const [tempRadius, setTempRadius] = useState(serviceRadius);

  const handleApplyRadius = () => {
    updateServiceRadius(tempRadius);
    setRadiusModalVisible(false);
  };

  return (
    <>
      <View style={styles.locationRow}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={refreshLocation}
        >
          <Ionicons name="location" size={16} color={Colors.surface} />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.radiusButton}
          onPress={() => {
            setTempRadius(serviceRadius);
            setRadiusModalVisible(true);
          }}
        >
          <Ionicons name="radio-button-on" size={16} color={Colors.surface} />
          <Text style={styles.radiusText}>{serviceRadius}km</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.surface} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      </View>

      {/* Service Radius Modal */}
      <Modal
        visible={radiusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRadiusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Service Radius</Text>
            <Text style={styles.modalSubtitle}>
              Set how far you're willing to travel for orders
            </Text>
            
            <View style={styles.radiusDisplay}>
              <Ionicons name="radio-button-on" size={32} color={Colors.primary} />
              <Text style={styles.radiusValue}>{tempRadius} km</Text>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={tempRadius}
              onValueChange={setTempRadius}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.text.disabled}
              thumbTintColor={Colors.primary}
            />

            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabel}>1km</Text>
              <Text style={styles.radiusLabel}>50km</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setTempRadius(serviceRadius);
                  setRadiusModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleApplyRadius}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.surface,
    fontWeight: Typography.weights.medium,
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  radiusText: {
    fontSize: Typography.sizes.sm,
    color: Colors.surface,
    fontWeight: Typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  radiusDisplay: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  radiusValue: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  radiusLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.disabled,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: Colors.background,
  },
  modalButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  modalButtonTextSecondary: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
});
