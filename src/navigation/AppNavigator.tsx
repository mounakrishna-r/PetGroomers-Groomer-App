import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Import screens (we'll create these next)
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';

import OrdersScreen from '../screens/main/OrdersScreen';
import AvailableOrdersScreen from '../screens/main/AvailableOrdersScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EarningsScreen from '../screens/main/EarningsScreen';
import OrderDetailsScreen from '../screens/main/OrderDetailsScreen';

import { AuthStackParamList, MainTabParamList, RootStackParamList } from '../types';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Stack Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Orders':
            iconName = focused ? 'clipboard' : 'clipboard-outline';
            break;
          case 'Available':
            iconName = focused ? 'notifications' : 'notifications-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          case 'Earnings':
            iconName = focused ? 'wallet' : 'wallet-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#f97316', // Orange color
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E5E7EB',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
    })}
  >
    <MainTab.Screen 
      name="Orders" 
      component={OrdersScreen}
      options={{ tabBarLabel: 'My Orders' }}
    />
    <MainTab.Screen 
      name="Available" 
      component={AvailableOrdersScreen}
      options={{ tabBarLabel: 'Available' }}
    />
    <MainTab.Screen 
      name="Earnings" 
      component={EarningsScreen}
      options={{ tabBarLabel: 'Earnings' }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profile' }}
    />
  </MainTab.Navigator>
);

// Root Navigator
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading screen while checking auth
    return null; // You can create a loading component here
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// Main App Navigator
export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}