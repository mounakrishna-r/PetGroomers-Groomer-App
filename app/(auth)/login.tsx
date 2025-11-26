import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import SmartLoginInput from '../../components/ui/SmartLoginInput';
import GroomerAPI from '../../services/GroomerAPI';

interface IdentifierData {
  type: 'email' | 'phone';
  value: string;
}

export default function SmartLoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [identifierData, setIdentifierData] = useState<IdentifierData | null>(null);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, verifyOTP } = useAuth();

  // Handle email login with password
  const handleEmailLogin = async () => {
    if (!password.trim() || !identifierData) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(identifierData.value, password);
      
      if (result.success) {
        router.replace('/(tabs)/available');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone login with OTP
  const handleSendOTP = async () => {
    if (!identifierData || identifierData.type !== 'phone') {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await GroomerAPI.sendOTP(identifierData.value);
      
      if (result.success) {
        setOtpSent(true);
        setError('');
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || !identifierData) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use AuthContext's verifyOTP which handles authentication state properly
      const result = await verifyOTP(identifierData.value, otp.trim(), true);
      
      if (result.success) {
        router.replace('/(tabs)/available');
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputTypeChange = useCallback((type: 'email' | 'phone', fullValue: string) => {
    setIdentifierData({ type, value: fullValue });
    // Reset form state when input type changes
    setPassword('');
    setOtp('');
    setOtpSent(false);
    setError('');
  }, []);

  const handleReset = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  const getTitle = () => {
    if (!identifierData) return 'Welcome to PetGroomers';
    if (identifierData.type === 'email') return 'Enter Your Password';
    if (otpSent) return 'Enter OTP Code';
    return 'We\'ll Send You an OTP';
  };

  const getSubtitle = () => {
    if (!identifierData) return 'Enter your email or phone number';
    if (identifierData.type === 'email') return 'Sign in with your password';
    if (otpSent) return `Code sent to ${identifierData.value}`;
    return 'Tap Send OTP to receive your verification code';
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
            <View style={styles.content}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>🐾</Text>
                </View>
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
              </View>

              {/* Form Container */}
              <View style={styles.formContainer}>
                
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Smart Input - Always Visible */}
                <SmartLoginInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onInputTypeChange={handleInputTypeChange}
                  placeholder="Email or phone number"
                  error={error}
                />

                {/* Email Flow - Password Input */}
                {identifierData?.type === 'email' && (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={Colors.text.disabled}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.continueButton, loading && styles.buttonDisabled]}
                      onPress={handleEmailLogin}
                      disabled={loading || !password.trim()}
                    >
                      <LinearGradient
                        colors={Colors.gradients.secondary}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>
                          {loading ? 'Signing In...' : 'Sign In'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Phone Flow - OTP */}
                {identifierData?.type === 'phone' && (
                  <>
                    {!otpSent ? (
                      <TouchableOpacity
                        style={[styles.continueButton, loading && styles.buttonDisabled]}
                        onPress={handleSendOTP}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={Colors.gradients.secondary}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.buttonText}>
                            {loading ? 'Sending...' : 'Send OTP'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter OTP"
                            placeholderTextColor={Colors.text.disabled}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                            maxLength={6}
                            autoFocus
                          />
                        </View>

                        <TouchableOpacity
                          style={[styles.continueButton, loading && styles.buttonDisabled]}
                          onPress={handleVerifyOTP}
                          disabled={loading || !otp.trim()}
                        >
                          <LinearGradient
                            colors={Colors.gradients.secondary}
                            style={styles.buttonGradient}
                          >
                            <Text style={styles.buttonText}>
                              {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                          <Text style={styles.resetText}>Resend OTP</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}

                {/* Sign Up Link */}
                <View style={styles.signupSection}>
                  <Text style={styles.signupText}>New to PetGroomers? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.signupLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <Text style={styles.securityText}>
                  🔒 Your information is secure and encrypted
                </Text>
              </View>
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: Typography.sizes.header,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.surface,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
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

  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#dc2626',
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.text.disabled,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 56,
  },
  continueButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  resetButton: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resetText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  signupText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  securityNote: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  securityText: {
    color: Colors.surface,
    fontSize: Typography.sizes.sm,
    opacity: 0.8,
  },
});