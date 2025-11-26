import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Colors';
import PhoneInput from '../components/ui/PhoneInput';
import AddressInput from '../components/ui/AddressInput';

export default function ComponentsDemo() {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.title}>Enhanced Input Components</Text>
        <Text style={styles.subtitle}>
          New PhoneInput with country code picker and AddressInput with location button
        </Text>

        {/* Phone Input Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Input with Country Code</Text>
          <Text style={styles.description}>
            Tap the country flag to select different countries and dial codes
          </Text>
          
          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
          />
          
          {phone && (
            <View style={styles.valueDisplay}>
              <Text style={styles.valueLabel}>Value:</Text>
              <Text style={styles.valueText}>{phone}</Text>
            </View>
          )}
        </View>

        {/* Address Input Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Input with Location</Text>
          <Text style={styles.description}>
            Tap the location button to automatically fill with your current address
          </Text>
          
          <AddressInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            multiline
          />
          
          {address && (
            <View style={styles.valueDisplay}>
              <Text style={styles.valueLabel}>Address:</Text>
              <Text style={styles.valueText}>{address}</Text>
            </View>
          )}
        </View>

        {/* Single Line Address Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Single Line Address Input</Text>
          
          <AddressInput
            value=""
            onChangeText={() => {}}
            placeholder="Single line address"
            multiline={false}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.sizes.title,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  valueDisplay: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  valueLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  valueText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
});