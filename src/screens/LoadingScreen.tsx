import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🐾</Text>
      </View>
      <Text style={styles.title}>Groomers on Wheels</Text>
      <Text style={styles.subtitle}>Loading...</Text>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary[500]} 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
});