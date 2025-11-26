import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

// Country data (subset for demo - in production, use a proper library)
// India first as PetGroomers is Chennai-based
const COUNTRIES = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
];

interface SmartLoginInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onInputTypeChange: (type: 'email' | 'phone', fullValue: string) => void;
  placeholder?: string;
  error?: string;
}

export default function SmartLoginInput({
  value,
  onChangeText,
  onInputTypeChange,
  placeholder = "Email or phone number",
  error
}: SmartLoginInputProps) {
  const [inputType, setInputType] = useState<'email' | 'phone' | 'unknown'>('unknown');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to India (+91) for PetGroomers
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const lastDetectedType = useRef<{type: string, value: string} | null>(null);

  // Smart detection of input type
  useEffect(() => {
    const detectInputType = (input: string) => {
      // Remove spaces and special characters for detection
      const cleanInput = input.replace(/[\s\-\(\)]/g, '');
      
      if (!cleanInput) {
        setInputType('unknown');
        setIsPhoneMode(false);
        return;
      }

      // Email detection
      if (cleanInput.includes('@')) {
        setInputType('email');
        setIsPhoneMode(false);
        
        // Only call onInputTypeChange if type or value changed
        const currentState = { type: 'email', value: cleanInput };
        if (!lastDetectedType.current || 
            lastDetectedType.current.type !== currentState.type || 
            lastDetectedType.current.value !== currentState.value) {
          lastDetectedType.current = currentState;
          onInputTypeChange('email', cleanInput);
        }
        return;
      }

      // Phone detection (starts with + or is all digits)
      if (cleanInput.startsWith('+') || /^\d+$/.test(cleanInput)) {
        setInputType('phone');
        setIsPhoneMode(true);
        
        let fullPhoneNumber = cleanInput;
        
        // If no country code, prepend selected country's dial code
        if (!cleanInput.startsWith('+')) {
          fullPhoneNumber = selectedCountry.dialCode + cleanInput;
        }
        
        // Only call onInputTypeChange if type or value changed
        const currentState = { type: 'phone', value: fullPhoneNumber };
        if (!lastDetectedType.current || 
            lastDetectedType.current.type !== currentState.type || 
            lastDetectedType.current.value !== currentState.value) {
          lastDetectedType.current = currentState;
          onInputTypeChange('phone', fullPhoneNumber);
        }
        return;
      }

      setInputType('unknown');
      setIsPhoneMode(false);
      lastDetectedType.current = null;
    };

    detectInputType(value);
  }, [value, selectedCountry.dialCode]);

  // Auto-detect country from phone number
  useEffect(() => {
    if (inputType === 'phone' && value.startsWith('+')) {
      const detectedCountry = COUNTRIES.find(country => 
        value.startsWith(country.dialCode)
      );
      if (detectedCountry && detectedCountry.code !== selectedCountry.code) {
        setSelectedCountry(detectedCountry);
      }
    }
  }, [value, inputType]);

  const formatPhoneNumber = (phone: string) => {
    // Remove country code for display if it matches selected country
    if (phone.startsWith(selectedCountry.dialCode)) {
      return phone.slice(selectedCountry.dialCode.length);
    }
    return phone;
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
    
    // Update the phone number with new country code
    if (inputType === 'phone' && value) {
      const phoneWithoutCode = formatPhoneNumber(value);
      const newFullNumber = country.dialCode + phoneWithoutCode;
      
      // Update the last detected state to prevent duplicate calls
      lastDetectedType.current = { type: 'phone', value: newFullNumber };
      
      onChangeText(phoneWithoutCode); // Display without country code
      onInputTypeChange('phone', newFullNumber);
    }
  };

  const getInputIcon = () => {
    if (inputType === 'email') return 'mail-outline';
    if (inputType === 'phone') return 'call-outline';
    return 'person-outline';
  };

  const getInputHint = () => {
    if (!value) return placeholder;
    if (inputType === 'email') return 'Email detected';
    if (inputType === 'phone') return `Phone (${selectedCountry.dialCode})`;
    return 'Enter email or phone';
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer, 
        error && styles.inputError,
        inputType !== 'unknown' && styles.inputDetected
      ]}>
        {/* Country Selector for Phone */}
        {isPhoneMode && (
          <TouchableOpacity
            style={styles.countryButton}
            onPress={() => setShowCountrySelector(!showCountrySelector)}
          >
            <Text style={styles.flagText}>{selectedCountry.flag}</Text>
            <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Input Icon */}
        <Ionicons 
          name={getInputIcon() as any} 
          size={20} 
          color={inputType === 'unknown' ? Colors.text.disabled : Colors.primary} 
          style={[styles.inputIcon, isPhoneMode && styles.inputIconPhone]} 
        />

        {/* Text Input */}
        <TextInput
          style={[styles.input, isPhoneMode && styles.phoneInput]}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          value={isPhoneMode ? formatPhoneNumber(value) : value}
          onChangeText={handleTextChange}
          keyboardType={inputType === 'email' ? 'email-address' : inputType === 'phone' ? 'phone-pad' : 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={inputType === 'email' ? 'email' : inputType === 'phone' ? 'tel' : 'off'}
        />

        {/* Status Indicator */}
        {inputType !== 'unknown' && (
          <View style={styles.statusIndicator}>
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={Colors.secondary} 
            />
          </View>
        )}
      </View>

      {/* Input Hint */}
      <Text style={[
        styles.hintText,
        inputType !== 'unknown' && styles.hintDetected
      ]}>
        {getInputHint()}
      </Text>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Country Selector Dropdown */}
      {showCountrySelector && (
        <View style={styles.countryDropdown}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryOption,
                selectedCountry.code === country.code && styles.countryOptionSelected
              ]}
              onPress={() => handleCountrySelect(country)}
            >
              <Text style={styles.flagText}>{country.flag}</Text>
              <Text style={styles.countryName}>{country.name}</Text>
              <Text style={styles.dialCodeText}>{country.dialCode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.text.disabled,
    minHeight: 56,
  },
  inputDetected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0f9ff',
  },
  inputError: {
    borderColor: Colors.error || '#ef4444',
    backgroundColor: '#fef2f2',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
    marginRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.text.disabled,
  },
  flagText: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  dialCodeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
    marginRight: Spacing.xs,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  inputIconPhone: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.xs,
  },
  phoneInput: {
    // Additional styling for phone input
  },
  statusIndicator: {
    marginLeft: Spacing.sm,
  },
  hintText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.disabled,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  hintDetected: {
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error || '#ef4444',
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  countryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  countryOptionSelected: {
    backgroundColor: Colors.primary + '20',
  },
  countryName: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
});