import { Platform } from 'react-native';
import { BoundingBox, DefectType, FrameMeta } from '../lib/types';

export type Inference = { type: DefectType; confidence: number; bbox: BoundingBox };

export interface YoloBackend {
  infer(frame: FrameMeta): Promise<Inference[]>;
}

const defectTypes: DefectType[] = ['pothole', 'crack', 'damage', 'depression', 'marking'];

function defectType(value: unknown): DefectType | undefined {
  const name = String(value ?? '').trim().toLowerCase();
  if (name === 'manhole') return 'damage';
  return defectTypes.includes(name as DefectType) ? (name as DefectType) : undefined;
}

function toNumber(value: unknown, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeBox(value: unknown, width: number, height: number): BoundingBox | undefined {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  if (Array.isArray(value) && value.length >= 4) {
    const [x1, y1, x2, y2] = value.map((item) => toNumber(item));
    return { x: clamp(x1 / safeWidth), y: clamp(y1 / safeHeight), w: clamp((x2 - x1) / safeWidth), h: clamp((y2 - y1) / safeHeight) };
  }
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  const x = toNumber(row.x ?? row.left);
  const y = toNumber(row.y ?? row.top);
  const w = toNumber(row.w ?? row.width ?? (toNumber(row.x2) - x));
  const h = toNumber(row.h ?? row.height ?? (toNumber(row.y2) - y));
  const alreadyNormalized = Math.max(Math.abs(x), Math.abs(y), Math.abs(w), Math.abs(h)) <= 1;
  return {
    x: clamp(alreadyNormalized ? x : x / safeWidth),
    y: clamp(alreadyNormalized ? y : y / safeHeight),
    w: clamp(alreadyNormalized ? w : w / safeWidth),
    h: clamp(alreadyNormalized ? h : h / safeHeight),
  };
}

export class RemoteYoloBackend implements YoloBackend {
  lastVideoUrl?: string;

  constructor(private endpoint = process.env.EXPO_PUBLIC_YOLO_ENDPOINT ?? '') {}

  get configured() {
    return Boolean(this.endpoint);
  }

  get origin() {
    return this.endpoint.replace(/\/api(?:\/.*)?$/, '');
  }

  private parse(payload: unknown, width = 1, height = 1): Inference[] {
    const object = payload as { detections?: unknown; predictions?: unknown } | undefined;
    const rows = Array.isArray(payload) ? payload : Array.isArray(object?.detections) ? object.detections : Array.isArray(object?.predictions) ? object.predictions : [];
    return rows
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          type: defectType(row.type ?? row.class ?? row.label),
          confidence: toNumber(row.confidence ?? row.score),
          bbox: normalizeBox(row.bbox ?? row, width, height),
        };
      })
      .filter((row): row is Inference => Boolean(row.type && row.bbox && row.bbox.w > 0 && row.bbox.h > 0 && row.confidence > 0));
  }

  async infer(frame: FrameMeta): Promise<Inference[]> {
    if (!this.configured) return [];
    try {
      const response = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(frame) });
      return response.ok ? this.parse(await response.json()) : [];
    } catch {
      return [];
    }
  }

  async inferMedia(uri: string, mediaType: 'image' | 'video', width = 1, height = 1): Promise<Inference[]> {
    if (!this.configured) throw new Error('YOLO is not configured. Set EXPO_PUBLIC_YOLO_ENDPOINT to your server’s /api/detect URL.');
    const body = new FormData();
    if (Platform.OS === 'web') {
      const file = await fetch(uri).then((response) => response.blob());
      body.append('file', file, `roadvision.${mediaType === 'video' ? 'mp4' : 'jpg'}`);
    } else {
      body.append('file', { uri, name: `roadvision.${mediaType === 'video' ? 'mp4' : 'jpg'}`, type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' } as never);
    }
    const endpoint = mediaType === 'video' && this.endpoint.endsWith('/api/detect') ? this.endpoint.replace(/\/api\/detect$/, '/api/detect-video') : this.endpoint;
    const response = await fetch(endpoint, { method: 'POST', body });
    const payload = await response.json().catch(() => undefined) as { success?: boolean; error?: string; preview_url?: string; video?: string } | undefined;
    if (!response.ok) throw new Error(payload?.error ?? `YOLO server returned HTTP ${response.status}.`);
    if (!payload || payload.success === false) throw new Error(payload?.error ?? 'YOLO server could not analyze this media.');
    const previewUrl = payload.preview_url ?? payload.video;
    this.lastVideoUrl = mediaType === 'video' && previewUrl ? (previewUrl.startsWith('http') ? previewUrl : `${this.origin}${previewUrl}`) : undefined;
    return this.parse(payload, width, height);
  }
}

export const yoloAPI = {
  backend: new RemoteYoloBackend(),
  demoMode: false,
  infer(frame: FrameMeta) {
    return this.backend.infer(frame);
  },
  inferMedia(uri: string, mediaType: 'image' | 'video', width?: number, height?: number) {
    return this.backend.inferMedia(uri, mediaType, width, height);
  },
  getLastVideoUrl() {
    return this.backend.lastVideoUrl;
  },
};
