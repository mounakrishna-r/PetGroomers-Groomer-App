import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

interface AddressInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  onLocationDataChange?: (data: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => void;
  placeholder?: string;
  style?: any;
  multiline?: boolean;
  disabled?: boolean;
}

export default function AddressInput({
  value,
  onChangeText,
  onCoordinatesChange,
  onLocationDataChange,
  placeholder = "Address",
  style,
  multiline = true,
  disabled = false,
}: AddressInputProps) {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [focused, setFocused] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to get your current address.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.streetNumber,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');

        onChangeText(formattedAddress || `${location.coords.latitude}, ${location.coords.longitude}`);
        
        // Pass all location data to parent
        if (onLocationDataChange) {
          onLocationDataChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            city: address.city || '',
            state: address.region || '',
            postalCode: address.postalCode || '',
            country: address.country || '',
          });
        } else if (onCoordinatesChange) {
          // Fallback to old callback for backward compatibility
          onCoordinatesChange(location.coords.latitude, location.coords.longitude);
        }
      } else {
        // Fallback to coordinates if no address found
        onChangeText(`${location.coords.latitude}, ${location.coords.longitude}`);
        if (onLocationDataChange) {
          onLocationDataChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            city: '',
            state: '',
            postalCode: '',
            country: '',
          });
        } else if (onCoordinatesChange) {
          onCoordinatesChange(location.coords.latitude, location.coords.longitude);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error',
        'Unable to get your current location. Please enter address manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, focused && styles.inputContainerFocused]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        
        <TouchableOpacity
          style={[
            styles.locationButton,
            loadingLocation && styles.locationButtonLoading,
          ]}
          onPress={getCurrentLocation}
          disabled={disabled || loadingLocation}
        >
          <Ionicons
            name={loadingLocation ? "refresh" : "location"}
            size={20}
            color={
              disabled ? Colors.text.disabled : 
              loadingLocation ? Colors.warning : 
              Colors.primary
            }
            style={loadingLocation ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.text.disabled,
    alignItems: 'flex-start',
  },
  inputContainerFocused: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  locationButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.xs,
    marginTop: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderLeftColor: Colors.text.disabled,
  },
  locationButtonLoading: {
    backgroundColor: Colors.warning + '20',
  },
  spinning: {
    // Add rotation animation if needed
  },
});