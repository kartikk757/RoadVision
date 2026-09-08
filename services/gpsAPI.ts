import { Incident, LocationInfo } from '../lib/types';

export const gpsAPI = {
  async reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
    return {
      lat,
      lng,
      road: 'Current location',
      city: 'Unknown city',
      state: 'Unknown state',
    };
  },
  bounds(incidents: Incident[] = []) {
    if (!incidents.length) return undefined;
    const lats = incidents.map((i) => i.location.lat);
    const lngs = incidents.map((i) => i.location.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  },
};
