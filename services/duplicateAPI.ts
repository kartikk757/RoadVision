import { DuplicateMatch, Incident } from '../lib/types';
import { fetchIncidents } from './backendData';

const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

export const duplicateAPI = {
  async forIncident(id: string): Promise<{ incident: Incident; match?: DuplicateMatch } | undefined> {
    await delay();
    const incidents = await fetchIncidents();
    const incident = incidents.find((i) => i.id === id);
    if (!incident) return undefined;
    return { incident, match: incident.duplicate };
  },
};
