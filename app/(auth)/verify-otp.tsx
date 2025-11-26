import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import GroomerAPI from '../../services/GroomerAPI';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPScreen() {
  const { phone, loginFlow } = useLocalSearchParams<{ phone: string; loginFlow?: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { verifyOTP, updateGroomerData, login } = useAuth();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Send initial OTP when component mounts (for registration flow)
  useEffect(() => {
    if (phone) {
      console.log('📨 Sending initial OTP to:', phone);
      GroomerAPI.sendOTP(phone).then(result => {
        console.log('✉️ Initial OTP send result:', result);
        if (!result.success) {
          Alert.alert('Error', 'Failed to send OTP. Please try again.');
        }
      });
    }
  }, [phone]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scrollToOTPInput();
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      // Scroll back to top when keyboard closes
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    console.log('🔐 Verifying OTP:', otp, 'for phone:', phone);
    console.log('🔍 Login flow:', loginFlow);
    
    setLoading(true);
    const result = await verifyOTP(phone, otp.trim(), loginFlow === 'true');
    
    console.log('✅ Verify OTP result:', result);

    if (result.success) {
      if (result.verificationOnly) {
        setLoading(false);
        if (result.loginReady) {
          // Login flow - phone verified, redirect to login
          Alert.alert(
            'Phone Verified!', 
            'Your phone is now verified. Please enter your password to complete login.',
            [{
              text: 'Continue',
              onPress: () => router.replace({
                pathname: '/(auth)/login',
                params: { verifiedPhone: phone, mode: 'email' } // Switch to email+password mode
              })
            }]
          );
        } else {
          // Registration verification - redirect to login
          Alert.alert(
            'Verification Successful', 
            result.message || 'Your phone number has been verified. Please login to continue.',
            [{
              text: 'Login Now',
              onPress: () => router.replace('/(auth)/login')
            }]
          );
        }
      } else {
        // Full authentication successful (registration flow)
        setLoading(false);
        router.replace('/(tabs)/available');
      }
    } else {
      setLoading(false);
      Alert.alert('Error', result.error || 'Invalid OTP');
      setOtp('');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    console.log('🔄 Resending OTP to:', phone);
    setResendLoading(true);
    const result = await GroomerAPI.sendOTP(phone);
    setResendLoading(false);
    
    console.log('📨 Resend OTP result:', result);

    if (result.success) {
      setTimer(30);
      setOtp('');
      Alert.alert('Success', 'OTP sent successfully to ' + formatPhoneNumber(phone || ''));
    } else {
      console.error('❌ Resend OTP failed:', result.error);
      Alert.alert('Error', result.error || 'Failed to send OTP. Please check your phone number.');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, -4) + '****';
  };

  const scrollToOTPInput = () => {
    // Smooth scroll to optimal position for OTP input visibility
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ 
        y: Platform.OS === 'ios' ? 180 : 200, 
        animated: true 
      });
    }, 150);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.primary}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            bounces={true}
          >
            <View style={[styles.content, keyboardVisible && styles.contentKeyboardVisible]}>
            
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            {/* OTP Verification Section */}
            <View style={styles.otpSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="phone-portrait" size={40} color={Colors.surface} />
              </View>
              <Text style={styles.title}>Verify Your Phone</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to{'\n'}
                <Text style={styles.phoneNumber}>{formatPhoneNumber(phone || 'Unknown')}</Text>
              </Text>
              {__DEV__ && (
                <Text style={styles.debugText}>
                  Debug: Full phone = {phone}
                </Text>
              )}
            </View>

            {/* OTP Form */}
            <TouchableOpacity 
              style={styles.formContainer}
              activeOpacity={1}
              onPress={() => otpInputRef.current?.focus()}
            >
              <View style={styles.otpInputContainer}>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={Colors.text.disabled}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
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
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend OTP in {timer} seconds
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOTP}
                    disabled={resendLoading}
                  >
                    <Text style={styles.resendButtonText}>
                      {resendLoading ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {/* Help Text - Hide when keyboard is visible */}
            {!keyboardVisible && (
              <View style={styles.helpSection}>
                <Text style={styles.helpText}>
                  Didn't receive the code? Check your SMS messages or try resending after the timer expires.
                </Text>
              </View>
            )}
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50, // Extra space at bottom for keyboard
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    minHeight: '100%',
  },
  contentKeyboardVisible: {
    paddingTop: Spacing.sm, // Reduce top padding when keyboard is visible
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  otpInputContainer: {
    marginBottom: Spacing.lg,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.xl,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    letterSpacing: 8,
    fontWeight: Typography.weights.bold,
  },
  verifyButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
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
  timerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: Spacing.sm,
  },
  resendButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  helpSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    opacity: 0.95,
  },
  helpText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  debugText: {
    fontSize: Typography.sizes.xs,
    color: Colors.surface,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});