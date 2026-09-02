import { incidents } from '../lib/mockData';
import { DuplicateMatch, Incident } from '../lib/types';

const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

export const duplicateAPI = {
  async forIncident(id: string): Promise<{ incident: Incident; match?: DuplicateMatch } | undefined> {
    await delay();
    const incident = incidents.find((i) => i.id === id);
    if (!incident) return undefined;
    return { incident, match: incident.duplicate };
  },
};
