import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, Stack } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import PhoneInput from '../../components/ui/PhoneInput';
import AddressInput from '../../components/ui/AddressInput';
import { RegisterData } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    fullPhone: '', // For international format
    password: '',
    confirmPassword: '',
    address: '',
    bio: '',
  });
  
  // OTP verification states
  const [otpStep, setOtpStep] = useState<'phone' | 'otp-sent' | 'verified'>('phone');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePhoneForOTP = () => {
    const { fullPhone } = formData;
    if (!fullPhone || fullPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (otpStep !== 'verified') {
      Alert.alert('Error', 'Please verify your phone number first');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneForOTP()) return;

    setOtpLoading(true);
    try {
      const result = await GroomerAPI.sendOTP(formData.fullPhone);
      if (result.success) {
        setOtpStep('otp-sent');
        Alert.alert('OTP Sent', `Verification code sent to ${formData.fullPhone}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const result = await GroomerAPI.verifyOTP(formData.fullPhone, otp);
      if (result.success) {
        setOtpStep('verified');
        Alert.alert('Success', 'Phone number verified! You can now create your account.');
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    // Prepare data for API
    const registrationData: RegisterData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.fullPhone, // Use the full international number
      password: formData.password,
      address: formData.address.trim() || undefined,
      bio: formData.bio.trim() || undefined,
    };
    
    console.log('📨 Registration data:', registrationData);
    console.log('📱 Full phone for OTP:', formData.fullPhone);
    const result = await register(registrationData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Registration Successful!',
        'Your account has been created and phone number verified. You can now start receiving orders!',
        [
          {
            text: 'Start Now',
            onPress: () => router.replace('/(tabs)/available')
          }
        ]
      );
    } else {
      Alert.alert('Registration Failed', result.error || 'Please try again');
    }
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
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Join PetGroomers</Text>
              <Text style={styles.subtitle}>Start your grooming business</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              
              {/* Personal Information */}
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <PhoneInput
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                onFullNumberChange={(fullNumber) => updateField('fullPhone', fullNumber)}
                placeholder="Phone Number *"
              />

              {/* Phone Verification Step */}
              {formData.fullPhone && (
                <View style={styles.verificationContainer}>
                  {otpStep === 'phone' && (
                    <TouchableOpacity
                      style={[styles.otpButton, otpLoading && styles.buttonDisabled]}
                      onPress={handleSendOTP}
                      disabled={otpLoading}
                    >
                      <Text style={styles.otpButtonText}>
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {otpStep === 'otp-sent' && (
                    <View style={styles.otpInputContainer}>
                      <Text style={styles.otpLabel}>Enter 6-digit verification code:</Text>
                      <View style={styles.otpRow}>
                        <TextInput
                          style={styles.otpInput}
                          placeholder="000000"
                          placeholderTextColor={Colors.text.disabled}
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                        />
                        <TouchableOpacity
                          style={[styles.verifyButton, otpLoading && styles.buttonDisabled]}
                          onPress={handleVerifyOTP}
                          disabled={otpLoading || otp.length !== 6}
                        >
                          <Text style={styles.verifyButtonText}>
                            {otpLoading ? 'Verifying...' : 'Verify'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleSendOTP}
                        disabled={otpLoading}
                      >
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {otpStep === 'verified' && (
                    <View style={styles.verifiedContainer}>
                      <Text style={styles.verifiedText}>✓ Phone number verified</Text>
                    </View>
                  )}
                </View>
              )}

              <AddressInput
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder="Address (Optional)"
                multiline
              />

              {/* Professional Information */}
              <Text style={styles.sectionTitle}>Professional Details</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Professional Bio (Optional)"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.bio}
                  onChangeText={(value) => updateField('bio', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Security */}
              <Text style={styles.sectionTitle}>Security</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 8 characters) *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton, 
                  (loading || otpStep !== 'verified') && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading || otpStep !== 'verified'}
              >
                <LinearGradient
                  colors={otpStep === 'verified' ? Colors.gradients.secondary : ['#cccccc', '#999999']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Creating Account...' : 
                     otpStep !== 'verified' ? 'Verify Phone First' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/(auth)/login" style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Sign In</Text>
                </Link>
              </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.surface,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 48,
  },
  registerButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  registerButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.md,
  },
  loginLink: {
    marginLeft: Spacing.xs,
  },
  loginLinkText: {
    color: Colors.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  verificationContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  otpButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  otpInputContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.text.disabled,
  },
  otpLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  verifyButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  resendButton: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  resendText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  verifiedContainer: {
    backgroundColor: '#e8f5e8',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  verifiedText: {
    color: '#2d5a2d',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});