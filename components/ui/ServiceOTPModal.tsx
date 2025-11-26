import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Order } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';

interface ServiceOTPModalProps {
  visible: boolean;
  order: Order | null;
  type: 'start' | 'complete';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ServiceOTPModal({
  visible,
  order,
  type,
  onSuccess,
  onCancel,
}: ServiceOTPModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);

  useEffect(() => {
    if (visible && order) {
      setOtp('');
      requestOTP();
    }
  }, [visible, order, type]);

  const requestOTP = async () => {
    if (!order) return;

    setRequestingOtp(true);
    try {
      const response = type === 'start'
        ? await GroomerAPI.requestServiceStartOTP(order.id)
        : await GroomerAPI.requestServiceEndOTP(order.id);

      if (!response.success) {
        Alert.alert('Error', response.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!order || !otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = type === 'start'
        ? await GroomerAPI.verifyServiceStartOTP(order.id, otp)
        : await GroomerAPI.verifyServiceEndOTP(order.id, otp);

      if (response.success) {
        Alert.alert(
          'Success',
          type === 'start' 
            ? 'Service started successfully!' 
            : 'Service completed successfully!',
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        Alert.alert('Error', response.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    return type === 'start' ? 'Start Service' : 'Complete Service';
  };

  const getDescription = () => {
    if (type === 'start') {
      return 'Enter the OTP sent to customer to start the service';
    } else {
      return 'Enter the OTP sent to customer to complete the service';
    }
  };

  const getIcon = () => {
    return type === 'start' ? 'play-circle' : 'checkmark-circle';
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* Header */}
          <LinearGradient
            colors={type === 'start' ? Colors.gradients.success : Colors.gradients.primary}
            style={styles.modalHeader}
          >
            <View style={styles.headerContent}>
              <Ionicons 
                name={getIcon() as any} 
                size={32} 
                color={Colors.surface} 
              />
              <Text style={styles.modalTitle}>{getTitle()}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onCancel}
              >
                <Ionicons name="close" size={24} color={Colors.surface} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.modalBody}>
            
            {/* Customer Information */}
            <View style={styles.customerInfo}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.customerRow}>
                <Ionicons name="person" size={16} color={Colors.primary} />
                <Text style={styles.customerText}>{order.customerName}</Text>
              </View>
              <View style={styles.customerRow}>
                <Ionicons name="call" size={16} color={Colors.primary} />
                <Text style={styles.customerText}>{order.customerPhone}</Text>
              </View>
              <View style={styles.customerRow}>
                <Ionicons name="paw" size={16} color={Colors.primary} />
                <Text style={styles.customerText}>
                  {order.petName} - {order.serviceName}
                </Text>
              </View>
            </View>

            {/* OTP Section */}
            <View style={styles.otpSection}>
              <Text style={styles.sectionTitle}>OTP Verification</Text>
              <Text style={styles.otpDescription}>{getDescription()}</Text>
              
              {requestingOtp ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Sending OTP...</Text>
                </View>
              ) : (
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor={Colors.text.disabled}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="center"
                    autoFocus
                  />
                  
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={requestOTP}
                  >
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (loading || otp.length !== 6) && styles.verifyButtonDisabled
                ]}
                onPress={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                <LinearGradient
                  colors={type === 'start' ? Colors.gradients.success : Colors.gradients.primary}
                  style={styles.verifyButtonGradient}
                >
                  <Text style={styles.verifyButtonText}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalHeader: {
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  customerInfo: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  customerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  otpSection: {
    marginBottom: Spacing.lg,
  },
  otpDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  otpInputContainer: {
    alignItems: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    letterSpacing: 8,
    textAlign: 'center',
    width: '80%',
    marginBottom: Spacing.md,
  },
  resendButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
  },
  verifyButton: {
    flex: 2,
    marginLeft: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
});