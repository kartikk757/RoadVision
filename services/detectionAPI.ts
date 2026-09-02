import { detections, incidents } from '../lib/mockData';
import { Detection, Incident } from '../lib/types';

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

export const detectionAPI = {
  async list(): Promise<Detection[]> {
    await delay();
    return detections;
  },
  async recent(limit = 8): Promise<Detection[]> {
    await delay();
    return [...detections].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, limit);
  },
  async getIncident(id: string): Promise<Incident | undefined> {
    await delay();
    return incidents.find((i) => i.id === id);
  },
  async listIncidents(): Promise<Incident[]> {
    await delay();
    return [...incidents].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  },
};
