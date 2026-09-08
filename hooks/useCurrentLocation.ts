import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation>();
  const [permission, setPermission] = useState<'checking' | 'granted' | 'denied'>('checking');

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | undefined;

    const start = async () => {
      const result = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (result.status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (mounted) {
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          accuracy: current.coords.accuracy,
        });
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (next) => {
          if (mounted) {
            setLocation({
              latitude: next.coords.latitude,
              longitude: next.coords.longitude,
              accuracy: next.coords.accuracy,
            });
          }
        },
      );
    };

    start().catch(() => {
      if (mounted) setPermission('denied');
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return { location, permission };
}
