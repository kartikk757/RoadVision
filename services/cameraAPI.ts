import { Camera, CameraStatus } from '../lib/types';
import { fetchCameras } from './backendData';

const delay = (ms = 240) => new Promise((r) => setTimeout(r, ms));
let extra: Camera[] = [];

export const cameraAPI = {
  async list(): Promise<Camera[]> {
    await delay();
    const backend = await fetchCameras();
    return [...backend, ...extra];
  },
  async add(partial: Omit<Camera, 'lastActive' | 'installedAt' | 'status' | 'fps'> & { fps?: number }): Promise<Camera> {
    await delay(400);
    const cam: Camera = {
      ...partial,
      fps: partial.fps ?? 0,
      status: 'connecting',
      lastActive: new Date().toISOString(),
      installedAt: new Date().toISOString().slice(0, 10),
    };
    extra = [...extra, cam];
    return cam;
  },
  async setStatus(id: string, status: CameraStatus, fps?: number): Promise<void> {
    extra = extra.map((c) => (c.id === id ? { ...c, status, fps: fps ?? c.fps, lastActive: new Date().toISOString() } : c));
  },
};
