import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

interface RadiusSettingsModalProps {
  visible: boolean;
  currentRadius: number;
  onClose: () => void;
  onSave: (radius: number) => void;
}

export default function RadiusSettingsModal({
  visible,
  currentRadius,
  onClose,
  onSave,
}: RadiusSettingsModalProps) {
  const [selectedRadius, setSelectedRadius] = useState(currentRadius);

  const quickSelectOptions = [5, 10, 15, 25, 50, 100];

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(Math.max(5, Math.min(100, radius)));
  };

  const handleSave = () => {
    if (selectedRadius < 5 || selectedRadius > 100) {
      Alert.alert('Invalid Radius', 'Service radius must be between 5km and 100km');
      return;
    }
    onSave(selectedRadius);
  };

  const getRadiusColor = (radius: number) => {
    if (radius <= 25) return Colors.status.completed;
    if (radius <= 50) return Colors.warning;
    return Colors.error;
  };

  const getRadiusDescription = (radius: number) => {
    if (radius <= 10) return 'Very Local Area';
    if (radius <= 25) return 'Local Area Coverage';
    if (radius <= 50) return 'Wide Coverage Area';
    return 'Maximum Coverage Area';
  };

  const renderQuickSelect = () => (
    <View style={styles.quickSelectContainer}>
      <Text style={styles.quickSelectTitle}>Quick Select (km)</Text>
      <View style={styles.quickSelectGrid}>
        {quickSelectOptions.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.quickSelectButton,
              selectedRadius === radius && styles.quickSelectButtonActive,
              { borderColor: getRadiusColor(radius) }
            ]}
            onPress={() => handleRadiusChange(radius)}
          >
            <Text
              style={[
                styles.quickSelectText,
                selectedRadius === radius && styles.quickSelectTextActive,
                selectedRadius === radius && { color: getRadiusColor(radius) }
              ]}
            >
              {radius}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFineAdjustment = () => (
    <View style={styles.fineAdjustmentContainer}>
      <Text style={styles.fineAdjustmentTitle}>Fine Adjustment</Text>
      
      <View style={styles.adjustmentRow}>
        <TouchableOpacity
          style={[styles.adjustmentButton, styles.decreaseButton]}
          onPress={() => handleRadiusChange(selectedRadius - 1)}
          disabled={selectedRadius <= 5}
        >
          <Ionicons name="remove" size={24} color={Colors.surface} />
        </TouchableOpacity>
        
        <View style={styles.radiusDisplay}>
          <Text style={styles.radiusNumber}>{selectedRadius}</Text>
          <Text style={styles.radiusUnit}>km</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.adjustmentButton, styles.increaseButton]}
          onPress={() => handleRadiusChange(selectedRadius + 1)}
          disabled={selectedRadius >= 100}
        >
          <Ionicons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.radiusIndicator}>
        <View style={styles.radiusBar}>
          <View
            style={[
              styles.radiusProgress,
              {
                width: `${(selectedRadius / 100) * 100}%`,
                backgroundColor: getRadiusColor(selectedRadius),
              }
            ]}
          />
        </View>
        <Text style={[styles.radiusDescription, { color: getRadiusColor(selectedRadius) }]}>
          {getRadiusDescription(selectedRadius)}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={Colors.gradients.warm} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={Colors.surface} />
            </TouchableOpacity>
            
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Service Radius</Text>
              <Text style={styles.headerSubtitle}>Set your coverage area</Text>
            </View>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Select Options */}
          {renderQuickSelect()}

          {/* Fine Adjustment */}
          {renderFineAdjustment()}

          {/* Information */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Larger radius means more orders but longer travel times
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                You can change your radius anytime based on your availability
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="car-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Consider traffic and parking when setting your radius
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface + '20',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.surface,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.surface + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  quickSelectContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  quickSelectTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickSelectButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.background,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickSelectButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  quickSelectText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
  },
  quickSelectTextActive: {
    fontWeight: Typography.weights.bold,
  },
  fineAdjustmentContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  fineAdjustmentTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  adjustmentButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decreaseButton: {
    backgroundColor: Colors.error,
  },
  increaseButton: {
    backgroundColor: Colors.status.completed,
  },
  radiusDisplay: {
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    minWidth: 100,
  },
  radiusNumber: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  radiusUnit: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  radiusIndicator: {
    alignItems: 'center',
  },
  radiusBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  radiusProgress: {
    height: '100%',
    borderRadius: 4,
  },
  radiusDescription: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});