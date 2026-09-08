import { Complaint } from '../lib/types';
import { fetchComplaints } from './backendData';

const delay = (ms = 240) => new Promise((r) => setTimeout(r, ms));

export const complaintAPI = {
  async list(): Promise<Complaint[]> {
    await delay();
    return fetchComplaints();
  },
  async get(id: string): Promise<Complaint | undefined> {
    await delay();
    const complaints = await fetchComplaints();
    return complaints.find((c) => c.id === id);
  },
  async byIncident(incidentId: string): Promise<Complaint | undefined> {
    await delay();
    const complaints = await fetchComplaints();
    return complaints.find((c) => c.incidentId === incidentId);
  },
};
