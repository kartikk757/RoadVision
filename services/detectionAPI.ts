import { Detection, Incident } from '../lib/types';
import { fetchDetections, fetchIncidents } from './backendData';

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

export const detectionAPI = {
  async list(): Promise<Detection[]> {
    await delay();
    return fetchDetections();
  },
  async recent(limit = 8): Promise<Detection[]> {
    await delay();
    const detections = await fetchDetections();
    return [...detections].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, limit);
  },
  async getIncident(id: string): Promise<Incident | undefined> {
    await delay();
    const incidents = await fetchIncidents();
    return incidents.find((i) => i.id === id);
  },
  async listIncidents(): Promise<Incident[]> {
    await delay();
    const incidents = await fetchIncidents();
    return [...incidents].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  },
};
