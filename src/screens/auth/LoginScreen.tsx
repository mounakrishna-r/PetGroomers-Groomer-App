import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import { useAuth } from '../../contexts/AuthContext';

type LoginScreenProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    identifier: 'demo@groomer.com', // email or phone - prefilled for demo
    password: 'demo123', // prefilled for demo
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const handleLogin = async () => {
    if (!formData.identifier) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    if (loginMethod === 'password' && !formData.password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      if (loginMethod === 'password') {
        // Password login using AuthContext
        const response = await login(formData.identifier, formData.password);

        if (response.success) {
          // Navigation will be handled by the auth state change
          Alert.alert('Success', 'Logged in successfully!');
        } else {
          Alert.alert('Login Failed', response.message || 'Invalid credentials');
        }
      } else {
        // OTP login
        const response = await GroomerAPI.sendOTP(formData.identifier);
        if (response.success) {
          navigation.navigate('OTPVerification', { 
            phone: formData.identifier,
            isRegistration: false 
          });
        } else {
          Alert.alert('Error', response.message || 'Failed to send OTP');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to start accepting orders</Text>
          </View>

          {/* Login Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'password' && styles.activeToggle
              ]}
              onPress={() => setLoginMethod('password')}
            >
              <Text style={[
                styles.toggleText,
                loginMethod === 'password' && styles.activeToggleText
              ]}>
                Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'otp' && styles.activeToggle
              ]}
              onPress={() => setLoginMethod('otp')}
            >
              <Text style={[
                styles.toggleText,
                loginMethod === 'otp' && styles.activeToggleText
              ]}>
                OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {loginMethod === 'otp' ? 'Phone Number' : 'Email or Phone'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name={loginMethod === 'otp' ? 'phone-portrait' : 'mail'} 
                  size={20} 
                  color="#9CA3AF" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.identifier}
                  onChangeText={(text) => setFormData({ ...formData, identifier: text })}
                  placeholder={loginMethod === 'otp' ? '+91 9876543210' : 'Enter email or phone'}
                  keyboardType={loginMethod === 'otp' ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {loginMethod === 'password' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color="#9CA3AF" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>
                  {loginMethod === 'otp' ? 'Sending OTP...' : 'Signing In...'}
                </Text>
              ) : (
                <Text style={styles.loginButtonText}>
                  {loginMethod === 'otp' ? 'Send OTP' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {loginMethod === 'password' && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Join as Groomer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF7ED',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#111827',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 16,
  },
  loginButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 16,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
  },
});