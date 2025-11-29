import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface CompactLocationBadgeProps {
  city?: string;
  serviceRadius?: number;
  onLocationPress?: () => void;
  onRadiusPress?: () => void;
  lightTheme?: boolean; // For light text on dark gradient
}

export default function CompactLocationBadge({
  city = 'Loading...',
  serviceRadius = 10,
  onLocationPress,
  onRadiusPress,
  lightTheme = true,
}: CompactLocationBadgeProps) {
  const textColor = lightTheme ? Colors.surface : Colors.text.primary;
  const bgColor = lightTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <View style={styles.container}>
      {/* Location Badge */}
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: bgColor }]}
        onPress={onLocationPress}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={14} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]} numberOfLines={1}>
          {city}
        </Text>
      </TouchableOpacity>

      {/* Service Radius Badge */}
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: bgColor, marginLeft: Spacing.xs }]}
        onPress={onRadiusPress}
        activeOpacity={0.7}
      >
        <Ionicons name="radio-button-on" size={14} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]}>
          {serviceRadius}km
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: 12,
    maxWidth: 120,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginLeft: 4,
  },
});
