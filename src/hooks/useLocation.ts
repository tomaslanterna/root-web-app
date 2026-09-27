import { useState, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export function useLocation() {
  const [location, setLocation] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            throw new Error('Permission denied');
          }
        }
      }
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setLocation(position);
      return position;
    } catch (err: any) {
      setError(err.message || 'Error getting location');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { location, error, isLoading, requestLocation };
}
