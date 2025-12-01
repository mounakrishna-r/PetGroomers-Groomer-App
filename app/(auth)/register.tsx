import React, { useMemo, useState, useRef } from 'react';
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
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import PhoneInput from '../../components/ui/PhoneInput';
import AddressInput from '../../components/ui/AddressInput';
import ExperienceSlider from '../../components/ui/ExperienceSlider';
import { RegisterData } from '../../types';
import GroomerAPI from '../../services/GroomerAPI';
import SupabaseStorage from '../../services/SupabaseStorage';

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
    experienceYears: 0,
    languages: [] as string[],
    resumeUrl: '',
    resumeFileName: '', // Store original filename
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    city: undefined as string | undefined,
    state: undefined as string | undefined,
    postalCode: undefined as string | undefined,
    country: undefined as string | undefined,
  });
  
  // OTP verification states
  const [otpStep, setOtpStep] = useState<'phone' | 'otp-sent' | 'verified'>('phone');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
  
  const { register } = useAuth();

  // Cooldown timer for resend OTP
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors on edit
    if (field === 'email' || field === 'password' || field === 'confirmPassword') {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validatePassword = (password: string) => {
    if (password && password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword && confirmPassword !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const languageOptions = useMemo(
    () => ({
      India: [
        'English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Gujarati','Punjabi','Bengali','Assamese','Odia','Urdu','Kashmiri','Konkani','Sindhi','Dogri','Maithili','Santali','Nepali','Bhojpuri',
      ],
      Global: [
        'Arabic','Spanish','French','Portuguese','German','Italian','Turkish','Russian','Chinese (Mandarin)','Japanese','Korean','Farsi (Persian)','Pashto','Sinhala',
      ]
    }),
    []
  );

  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '' });

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

    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is mandatory');
      return false;
    }

    if (formData.experienceYears < 0 || formData.experienceYears > 20) {
      Alert.alert('Error', 'Experience years must be between 0 and 20');
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneForOTP()) return;

    setOtpLoading(true);
    try {
      // First check if account already exists with this phone number
      console.log('🔍 Checking if account exists for registration...');
      const accountCheck = await GroomerAPI.checkAccountExists(formData.fullPhone);
      
      if (accountCheck.success && accountCheck.data?.exists) {
        // Account already exists, redirect to login
        Alert.alert(
          'Account Already Exists',
          'A groomer account already exists with this phone number. Please use the login screen instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Login', 
              onPress: () => router.push({
                pathname: '/(auth)/login',
                params: { phone: formData.fullPhone }
              })
            }
          ]
        );
        return;
      }
      
      // Account doesn't exist, proceed with registration OTP
      console.log('✅ Account check passed, sending registration OTP...');
      const result = await GroomerAPI.sendRegistrationOTP(formData.fullPhone);
      
      if (result.success) {
        setOtpStep('otp-sent');
        setResendCooldown(120); // 2 minutes = 120 seconds
        Alert.alert('OTP Sent', `Verification code sent to ${formData.fullPhone}. Valid for 5 minutes.`);
      } else {
        // Handle specific registration errors
        if (result.error?.includes('already registered')) {
          Alert.alert(
            'Account Exists',
            'An account already exists with this phone number. Please use the login screen instead.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Go to Login', 
                onPress: () => router.push({
                  pathname: '/(auth)/login',
                  params: { phone: formData.fullPhone }
                })
              }
            ]
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to send OTP');
        }
      }
    } catch (error) {
      console.error('❌ Registration OTP error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please check your internet connection and try again.');
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
      // Use registration-specific OTP verification (not login OTP)
      const result = await GroomerAPI.verifyRegistrationOTP(formData.fullPhone, otp);
      if (result.success) {
        setOtpStep('verified');
        Alert.alert('Success', 'Phone number verified! Please complete your registration details below.');
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('❌ Registration OTP verification error:', error);
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
      phone: formData.fullPhone,
      password: formData.password,
      address: formData.address.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      bio: formData.bio.trim() || undefined,
      experienceYears: formData.experienceYears,
      languages: formData.languages.join(', '), // Convert array to comma-separated string
      resumeUrl: formData.resumeUrl || undefined,
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

  const pickResume = async () => {
    try {
      setUploadingResume(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setUploadingResume(false);
        return;
      }
      
      const file = result.assets?.[0];
      if (!file) {
        setUploadingResume(false);
        return;
      }
      
      // For now, we need groomer ID to upload
      // So store file locally, upload will happen after registration
      // OR we can generate temp ID
      const tempId = Date.now(); // Temporary ID for filename
      
      // Upload to Supabase Storage
      const uploadResult = await SupabaseStorage.uploadResume(
        file.uri,
        tempId,
        file.name || 'resume.pdf'
      );
      
      if (uploadResult.success && uploadResult.url) {
        setFormData(prev => ({ 
          ...prev, 
          resumeUrl: uploadResult.url!,
          resumeFileName: file.name || 'resume.pdf'
        }));
        Alert.alert('Success', `Resume uploaded: ${file.name}`);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Could not upload file to server');
      }
      
      setUploadingResume(false);
    } catch (e: any) {
      console.error('Resume pick error:', e);
      Alert.alert('Error', 'Could not select or upload file');
      setUploadingResume(false);
    }
  };

  const LanguageChip = ({ lang }: { lang: string }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    
    React.useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, []);

    const handleRemove = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setFormData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
      });
    };

    return (
      <Animated.View style={[styles.chip, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.chipText}>{lang}</Text>
        <TouchableOpacity onPress={handleRemove}>
          <Ionicons name="close" size={14} color={Colors.text.secondary} />
        </TouchableOpacity>
      </Animated.View>
    );
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
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            
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
                  onFocus={() => Haptics.selectionAsync()}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email Address *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  onBlur={() => validateEmail(formData.email)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
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
                        disabled={otpLoading || resendCooldown > 0}
                      >
                        <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                          {resendCooldown > 0 
                            ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` 
                            : 'Resend OTP'}
                        </Text>
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
                onLocationDataChange={(data) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country,
                  }));
                }}
                placeholder="Address *"
                multiline
              />
              {/* Experience Years - slider */}
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={{ marginBottom: Spacing.md }}>
                <ExperienceSlider
                  value={formData.experienceYears}
                  onChange={(val) => setFormData(prev => ({ ...prev, experienceYears: val }))}
                  min={0}
                  max={20}
                />
              </View>

              {/* Languages Known - dropdown with multi-select */}
              <Text style={styles.sectionTitle}>Languages</Text>
              {/* Selected chips + count */}
              {formData.languages.length > 0 && (
                <View style={styles.chipsRow}>
                  <Text style={styles.selectedCount}>Selected: {formData.languages.length}</Text>
                  {formData.languages.map(lang => (
                    <LanguageChip key={lang} lang={lang} />
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguageDropdownOpen(true);
                }}
              >
                <Text style={{ color: Colors.text.primary }}>
                  {formData.languages.length ? 'Edit languages' : 'Select languages'}
                </Text>
              </TouchableOpacity>
              <Modal visible={languageDropdownOpen} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Languages</Text>
                    <TouchableOpacity onPress={() => { setLanguageDropdownOpen(false); setLanguageSearch(''); }}>
                      <Text style={styles.modalClose}>Close</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search languages"
                      placeholderTextColor={Colors.text.disabled}
                      value={languageSearch}
                      onChangeText={setLanguageSearch}
                    />
                  </View>
                  {/* Grouped list: India + Global */}
                  <FlatList
                    data={['India','Global']}
                    keyExtractor={(section) => section}
                    renderItem={({ item: section }) => {
                      const list = (languageOptions as any)[section].filter((l: string) => l.toLowerCase().includes(languageSearch.toLowerCase()));
                      return (
                        <View>
                          <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeaderText}>{section}</Text>
                            <Text style={styles.sectionHeaderSub}>{list.length} items</Text>
                          </View>
                          {list.map((lang: string) => (
                            <TouchableOpacity
                              key={lang}
                              style={styles.dropdownItem}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setFormData(prev => {
                                  const exists = prev.languages.includes(lang);
                                  const next = exists ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang];
                                  return { ...prev, languages: next };
                                });
                              }}
                            >
                              <View style={[styles.checkbox, formData.languages.includes(lang) && styles.checkboxChecked]} />
                              <Text style={{ color: Colors.text.primary }}>{lang}</Text>
                              {formData.languages.includes(lang) && (
                                <Ionicons name="checkmark" size={18} color={Colors.secondary} style={{ marginLeft: 'auto' }} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    }}
                  />
                </View>
              </Modal>

              {/* Resume Upload (optional file) */}
              <Text style={styles.sectionTitle}>Resume / Experience (Optional)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.uploadButton, uploadingResume && { opacity: 0.6 }]} 
                  onPress={pickResume}
                  disabled={uploadingResume}
                >
                  <Text style={styles.uploadButtonText}>
                    {uploadingResume ? 'Uploading...' : 'Upload File'}
                  </Text>
                </TouchableOpacity>
                {formData.resumeFileName ? (
                  <Text style={{ color: Colors.text.secondary, flex: 1 }} numberOfLines={1}>
                    ✓ {formData.resumeFileName}
                  </Text>
                ) : null}
              </View>

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
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Password (min 8 characters) *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  onBlur={() => validatePassword(formData.password)}
                  secureTextEntry
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm Password *"
                  placeholderTextColor={Colors.text.disabled}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  onBlur={() => validateConfirmPassword(formData.confirmPassword)}
                  secureTextEntry
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
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
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    marginTop: 4,
    marginLeft: 4,
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
  resendTextDisabled: {
    color: Colors.text.disabled,
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
  // Dropdown styles
  dropdownBox: {
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  selectedCount: { color: Colors.text.secondary, marginRight: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chipText: { color: Colors.primary, fontWeight: Typography.weights.medium },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
    backgroundColor: Colors.surface,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.text.disabled,
    borderRadius: 4,
    marginRight: 4,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalTitle: { color: Colors.text.primary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold },
  modalClose: { color: Colors.primary, fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium },
  searchRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    color: Colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  sectionHeaderText: { color: Colors.text.primary, fontWeight: Typography.weights.semibold },
  sectionHeaderSub: { color: Colors.text.secondary },
  uploadButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  uploadButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});