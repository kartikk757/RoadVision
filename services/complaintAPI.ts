import { complaints } from '../lib/mockData';
import { Complaint } from '../lib/types';

const delay = (ms = 240) => new Promise((r) => setTimeout(r, ms));

export const complaintAPI = {
  async list(): Promise<Complaint[]> {
    await delay();
    return complaints;
  },
  async get(id: string): Promise<Complaint | undefined> {
    await delay();
    return complaints.find((c) => c.id === id);
  },
  async byIncident(incidentId: string): Promise<Complaint | undefined> {
    await delay();
    return complaints.find((c) => c.incidentId === incidentId);
  },
};
