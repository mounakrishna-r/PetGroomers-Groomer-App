import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { GroomerAPI } from '../../services/api';

type OTPVerificationScreenProp = StackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export default function OTPVerificationScreen() {
  const navigation = useNavigation<OTPVerificationScreenProp>();
  const route = useRoute<OTPVerificationRouteProp>();
  
  const { phone, isRegistration = false } = route.params;
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await GroomerAPI.verifyOTP(phone, otp);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          isRegistration ? 'Account created successfully!' : 'Logged in successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled by auth state change
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    try {
      const response = await GroomerAPI.sendOTP(phone);
      if (response.success) {
        Alert.alert('Success', 'OTP sent successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>
        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.phoneNumber}>{phone}</Text>
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        <Text style={styles.label}>Enter Verification Code</Text>
        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
          autoFocus
        />
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.verifyButton, isLoading && styles.disabledButton]}
        onPress={handleVerifyOTP}
        disabled={isLoading || otp.length < 6}
      >
        <Text style={styles.verifyButtonText}>
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
        </Text>
      </TouchableOpacity>

      {/* Resend OTP */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code?</Text>
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={resendLoading}
        >
          <Text style={[styles.resendLink, resendLoading && styles.disabledText]}>
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Make sure you can receive SMS messages on this number
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF7ED',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: 'bold',
    color: '#111827',
  },
  otpContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 8,
    backgroundColor: '#F9FAFB',
  },
  verifyButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  resendText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
  },
  disabledText: {
    opacity: 0.6,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});