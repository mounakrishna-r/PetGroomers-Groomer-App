import React, { useState } from 'react';
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

type LoginStep = 'identifier' | 'password' | 'verification';

interface IdentifierData {
  type: 'email' | 'phone';
  value: string;
  exists: boolean;
}

export default function ProgressiveLoginScreen() {
  const [step, setStep] = useState<LoginStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [identifierData, setIdentifierData] = useState<IdentifierData | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Step 1: Handle identifier entry and validation
  const handleIdentifierSubmit = async () => {
    if (!identifier || !identifierData) {
      setError('Please enter a valid email or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if identifier exists in backend
      const checkResult = await GroomerAPI.checkIdentifier(identifierData.value, identifierData.type);
      
      if (checkResult.success && checkResult.data?.exists) {
        setIdentifierData({ ...identifierData, exists: true });
        setStep('password');
      } else {
        // Account doesn't exist - offer to register
        Alert.alert(
          'Account Not Found',
          `No account found with this ${identifierData.type}. Would you like to create one?`,
          [
            { text: 'Try Again', style: 'cancel' },
            { 
              text: 'Sign Up', 
              onPress: () => router.push({
                pathname: '/(auth)/register',
                params: { 
                  [identifierData.type]: identifierData.value 
                }
              })
            }
          ]
        );
      }
    } catch (error: any) {
      setError('Failed to check account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle password entry and login
  const handlePasswordSubmit = async () => {
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
        setError(result.error || 'Invalid password. Please try again.');
      }
    } catch (error: any) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputTypeChange = (type: 'email' | 'phone', fullValue: string) => {
    setIdentifierData({ type, value: fullValue, exists: false });
  };

  const handleBack = () => {
    if (step === 'password') {
      setStep('identifier');
      setPassword('');
      setError('');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'identifier':
        return 'Welcome to PetGroomers';
      case 'password':
        return `Hi ${identifierData?.type === 'email' ? 'there' : 'there'}!`;
      default:
        return 'Welcome';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'identifier':
        return 'Enter your email or phone number to get started';
      case 'password':
        return `Enter your password to continue`;
      default:
        return '';
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
            <View style={styles.content}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>🐾</Text>
                </View>
                <Text style={styles.title}>{getStepTitle()}</Text>
                <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
              </View>

              {/* Form Container */}
              <View style={styles.formContainer}>
                
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepDot, step === 'identifier' ? styles.stepActive : styles.stepCompleted]}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <View style={styles.stepLine} />
                  <View style={[styles.stepDot, step === 'password' ? styles.stepActive : styles.stepInactive]}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Step 1: Identifier Input */}
                {step === 'identifier' && (
                  <>
                    <SmartLoginInput
                      value={identifier}
                      onChangeText={setIdentifier}
                      onInputTypeChange={handleInputTypeChange}
                      placeholder="Email or phone number"
                      error={error}
                    />
                    
                    <TouchableOpacity
                      style={[styles.continueButton, loading && styles.buttonDisabled]}
                      onPress={handleIdentifierSubmit}
                      disabled={loading || !identifierData}
                    >
                      <LinearGradient
                        colors={Colors.gradients.secondary}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>
                          {loading ? 'Checking...' : 'Continue'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Step 2: Password Input */}
                {step === 'password' && identifierData && (
                  <>
                    {/* Show selected identifier */}
                    <View style={styles.selectedIdentifier}>
                      <Text style={styles.identifierLabel}>
                        {identifierData.type === 'email' ? 'Email' : 'Phone'}
                      </Text>
                      <Text style={styles.identifierValue}>
                        {identifierData.type === 'email' 
                          ? identifierData.value 
                          : identifierData.value // Will show formatted phone with country code
                        }
                      </Text>
                      <TouchableOpacity onPress={handleBack} style={styles.changeButton}>
                        <Text style={styles.changeText}>Change</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Password Input */}
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
                      onPress={handlePasswordSubmit}
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

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotText}>Forgot your password?</Text>
                    </TouchableOpacity>
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepCompleted: {
    backgroundColor: Colors.secondary,
  },
  stepInactive: {
    backgroundColor: Colors.text.disabled,
  },
  stepNumber: {
    color: Colors.surface,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.text.disabled,
    marginHorizontal: Spacing.sm,
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
  selectedIdentifier: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  identifierLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginRight: Spacing.xs,
  },
  identifierValue: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  changeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  changeText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
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
  forgotPassword: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  forgotText: {
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