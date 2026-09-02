import { incidents } from '../lib/mockData';
import { LocationInfo } from '../lib/types';

export const gpsAPI = {
  async reverseGeocode(_lat: number, _lng: number): Promise<LocationInfo> {
    const hit = incidents[0].location;
    return hit;
  },
  bounds() {
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
