import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

interface ExperienceSliderProps {
  value: number; // 0 - 20
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export default function ExperienceSlider({ value, onChange, min = 0, max = 20 }: ExperienceSliderProps) {
  const handleValueChange = (val: number) => {
    const rounded = Math.round(val);
    if (rounded !== value) {
      Haptics.selectionAsync();
      onChange(rounded);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Years of Experience: {value}</Text>
      <View style={styles.sliderContainer}>
        <Slider
          minimumValue={min}
          maximumValue={max}
          step={1}
          value={value}
          onValueChange={handleValueChange}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.background}
          thumbTintColor={Colors.primary}
          style={styles.slider}
        />
        <Text style={styles.thumbEmoji}>🐶</Text>
      </View>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>{min}</Text>
        <Text style={styles.scaleText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  sliderContainer: {
    position: 'relative',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  slider: {
    height: 24,
  },
  thumbEmoji: {
    position: 'absolute',
    right: Spacing.sm,
    top: 2,
    fontSize: 16,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  scaleText: {
    color: Colors.text.disabled,
  },
});
