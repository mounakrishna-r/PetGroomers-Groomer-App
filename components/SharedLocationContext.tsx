import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import GroomerAPI from '../services/GroomerAPI';

interface LocationContextType {
  currentLocation: string;
  serviceRadius: number;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
  updateServiceRadius: (newRadius: number) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<string>('Loading...');
  const [serviceRadius, setServiceRadius] = useState<number>(10);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Location permission denied');
        setIsLoading(false);
        return;
      }

      const currentLoc = await Location.getCurrentPositionAsync({});
      setLatitude(currentLoc.coords.latitude);
      setLongitude(currentLoc.coords.longitude);
      
      // Get address from coordinates
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
        });
        
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          setCurrentLocation(addr.city || addr.region || 'Your Location');
        }
      } catch (geoError) {
        console.log('Geocoding error:', geoError);
        setCurrentLocation('Location detected');
      }

      // Sync to backend
      await syncToBackend(currentLoc.coords.latitude, currentLoc.coords.longitude, serviceRadius);
      
    } catch (error) {
      console.error('Location error:', error);
      setCurrentLocation('Chennai');
    } finally {
      setIsLoading(false);
    }
  };

  const syncToBackend = async (lat: number, lng: number, radius: number) => {
    try {
      const response = await GroomerAPI.updateLocation(lat, lng, radius);
      
      if (response.success) {
        console.log('✅ Location synced to backend:', {
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          radius: radius + 'km'
        });
      }
    } catch (error) {
      console.log('⚠️ Backend sync failed:', error);
    }
  };

  const refreshLocation = async () => {
    try {
      const currentLoc = await Location.getCurrentPositionAsync({});
      setLatitude(currentLoc.coords.latitude);
      setLongitude(currentLoc.coords.longitude);
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });
      
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const newLocation = addr.city || addr.region || 'Your Location';
        setCurrentLocation(newLocation);
        Alert.alert('📍 Location Updated', newLocation);
      }

      await syncToBackend(currentLoc.coords.latitude, currentLoc.coords.longitude, serviceRadius);
    } catch (error) {
      console.error('Refresh location error:', error);
    }
  };

  const updateServiceRadius = async (newRadius: number) => {
    setServiceRadius(newRadius);
    
    if (latitude && longitude) {
      await syncToBackend(latitude, longitude, newRadius);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        serviceRadius,
        latitude,
        longitude,
        isLoading,
        refreshLocation,
        updateServiceRadius,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useSharedLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useSharedLocation must be used within a LocationProvider');
  }
  return context;
};
