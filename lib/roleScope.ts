import { User, Incident, Complaint, Detection } from './types';

export const authorityRegions = [
  { authority: 'Public Works Department', division: 'Indore Division 4' },
  { authority: 'Public Works Department', division: 'Airport Corridor Cell' },
  { authority: 'Public Works Department', division: 'Ring Road Cell' },
  { authority: 'Indore Municipal Corporation', division: 'Zone 8 — Palasia' },
  { authority: 'Indore Municipal Corporation', division: 'Heritage Zone' },
];

export function scopeIncidents(user: User | null, list: Incident[] = []): Incident[] {
  if (user?.role !== 'authority') return list;
  return list.filter((i) => {
    if (user.division && i.division) return i.division === user.division;
    if (user.authority && i.authority) return i.authority === user.authority;
    return false;
  });
}

export function scopeComplaints(user: User | null, list: Complaint[] = []): Complaint[] {
  if (user?.role !== 'authority') return list;
  return list.filter((c) => {
    if (user.division) return c.division === user.division;
    if (user.authority) return c.authority === user.authority;
    return false;
  });
}

export function scopeDetections(user: User | null, list: Detection[] = []): Detection[] {
  if (user?.role !== 'authority') return list;
  const ids = new Set(scopeIncidents(user).map((i) => i.id));
  return list.filter((d) => ids.has(d.incidentId));
}

export function roleHomeCopy(user: User | null) {
  if (user?.role === 'authority') {
    return {
      subtitle: 'Your region',
      title: user.division ?? 'Assigned region',
      lead: `Complaints and evidence in ${user.division ?? 'your jurisdiction'} — not the whole city.`,
    };
  }
  if (user?.role === 'admin') {
    return {
      subtitle: 'Network command',
      title: 'Road Network',
      lead: 'Live YOLO across the fleet. Crop-only evidence. Full municipal view.',
    };
  }
  return {
    subtitle: 'Overview',
    title: 'Road Network',
    lead: 'Real-time road intelligence across the municipal fleet.',
  };
}
