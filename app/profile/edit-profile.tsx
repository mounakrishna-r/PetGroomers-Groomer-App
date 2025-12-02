import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../components/AuthContext';
import GroomerAPI from '../../services/GroomerAPI';

export default function EditProfileScreen() {
  const { groomer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    experienceYears: '',
    languages: '',
    
    // Bank Details
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    routingNumber: '',
    upiId: '',
    paypalEmail: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await GroomerAPI.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          experienceYears: profile.experienceYears?.toString() || '',
          languages: profile.languages || '',
          accountHolderName: profile.accountHolderName || '',
          bankName: profile.bankName || '',
          accountNumber: profile.accountNumber || '',
          ifscCode: profile.ifscCode || '',
          routingNumber: profile.routingNumber || '',
          upiId: profile.upiId || '',
          paypalEmail: profile.paypalEmail || '',
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Error', 'Valid email is required');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim() || null,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : null,
        languages: formData.languages.trim() || null,
        accountHolderName: formData.accountHolderName.trim() || null,
        bankName: formData.bankName.trim() || null,
        accountNumber: formData.accountNumber.trim() || null,
        ifscCode: formData.ifscCode.trim() || null,
        routingNumber: formData.routingNumber.trim() || null,
        upiId: formData.upiId.trim() || null,
        paypalEmail: formData.paypalEmail.trim() || null,
      };

      const response = await GroomerAPI.updateProfile(updateData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: any;
      multiline?: boolean;
      editable?: boolean;
      secure?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.inputMultiline,
          !options?.editable && styles.inputDisabled
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor={Colors.text.disabled}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        editable={options?.editable !== false}
        secureTextEntry={options?.secure}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Personal Information */}
        {renderSection('Personal Information', 'person-outline',
          <>
            {renderInput('Full Name *', formData.name, (text) =>
              setFormData({ ...formData, name: text })
            , { placeholder: 'Enter your full name' })}
            
            {renderInput('Email *', formData.email, (text) =>
              setFormData({ ...formData, email: text })
            , { placeholder: 'your.email@example.com', keyboardType: 'email-address' })}
            
            {renderInput('Phone', formData.phone, () => {},
              { editable: false, placeholder: 'Phone number (cannot be changed)' }
            )}
            
            {renderInput('Bio', formData.bio, (text) =>
              setFormData({ ...formData, bio: text })
            , { placeholder: 'Tell customers about yourself...', multiline: true })}
            
            {renderInput('Experience (Years)', formData.experienceYears, (text) =>
              setFormData({ ...formData, experienceYears: text.replace(/[^0-9]/g, '') })
            , { placeholder: '5', keyboardType: 'numeric' })}
            
            {renderInput('Languages', formData.languages, (text) =>
              setFormData({ ...formData, languages: text })
            , { placeholder: 'English, Hindi, Tamil' })}
          </>
        )}

        {/* Bank Details (India) */}
        {renderSection('Bank Details (India)', 'card-outline',
          <>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Bank details are required for receiving payments from completed orders.
              </Text>
            </View>
            
            {renderInput('Account Holder Name', formData.accountHolderName, (text) =>
              setFormData({ ...formData, accountHolderName: text })
            , { placeholder: 'Name as per bank account' })}
            
            {renderInput('Bank Name', formData.bankName, (text) =>
              setFormData({ ...formData, bankName: text })
            , { placeholder: 'HDFC Bank, ICICI Bank, SBI, etc.' })}
            
            {renderInput('Account Number', formData.accountNumber, (text) =>
              setFormData({ ...formData, accountNumber: text.replace(/[^0-9]/g, '') })
            , { placeholder: '123456789012', keyboardType: 'numeric', secure: true })}
            
            {renderInput('IFSC Code', formData.ifscCode, (text) =>
              setFormData({ ...formData, ifscCode: text.toUpperCase() })
            , { placeholder: 'SBIN0001234' })}
            
            {renderInput('UPI ID', formData.upiId, (text) =>
              setFormData({ ...formData, upiId: text })
            , { placeholder: 'yourname@paytm, 9876543210@ybl' })}
          </>
        )}

        {/* International Payment Details */}
        {renderSection('International Payments (Optional)', 'globe-outline',
          <>
            {renderInput('Routing Number', formData.routingNumber, (text) =>
              setFormData({ ...formData, routingNumber: text.replace(/[^0-9]/g, '') })
            , { placeholder: 'For US/International bank transfers', keyboardType: 'numeric' })}
            
            {renderInput('PayPal Email', formData.paypalEmail, (text) =>
              setFormData({ ...formData, paypalEmail: text })
            , { placeholder: 'your.paypal@email.com', keyboardType: 'email-address' })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient colors={Colors.gradients.primary} style={styles.saveButtonGradient}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  inputDisabled: {
    backgroundColor: Colors.background,
    color: Colors.text.disabled,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
});
