import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import GroomerAPI from '../../services/GroomerAPI';

export default function OTPVerificationScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { verifyOTP } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!phone) {
      Alert.alert('Error', 'Phone number not found');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(phone, otp);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Phone number verified successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } else {
      Alert.alert('Verification Failed', result.error || 'Invalid OTP');
    }
  };

  const handleResendOTP = async () => {
    if (!phone) return;

    setResendLoading(true);
    const response = await GroomerAPI.sendOTP(phone);
    setResendLoading(false);

    if (response.success) {
      setCountdown(60);
      Alert.alert('Success', 'OTP sent successfully');
    } else {
      Alert.alert('Error', response.error || 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.primary}
        style={styles.gradient}
      >
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <Text style={styles.title}>Verify Phone Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{phone}</Text>
            </Text>
          </View>

          {/* OTP Form */}
          <View style={styles.formContainer}>
            
            <View style={styles.otpContainer}>
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
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
            >
              <LinearGradient
                colors={Colors.gradients.secondary}
                style={styles.buttonGradient}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend OTP in {countdown} seconds
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendButtonText}>
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>🔐 Secure Verification</Text>
            <Text style={styles.infoText}>
              We use SMS verification to ensure the security of your account and 
              enable secure communication with customers during service delivery.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: Typography.weights.semibold,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  otpContainer: {
    marginBottom: Spacing.lg,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    fontSize: Typography.sizes.title,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    letterSpacing: 8,
  },
  verifyButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  resendSection: {
    alignItems: 'center',
  },
  countdownText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
  },
  resendButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    opacity: 0.95,
  },
  infoTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});