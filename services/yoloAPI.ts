import { BoundingBox, DefectType, FrameMeta, YoloBox } from '../lib/types';

export interface YoloBackend {
  infer(frame: FrameMeta): Promise<{ type: DefectType; confidence: number; bbox: BoundingBox }[]>;
}

function jitter(n: number, amp: number) {
  return Math.max(0.02, Math.min(0.92, n + (Math.random() - 0.5) * amp));
}

const SEEDS: Record<string, { type: DefectType; bbox: BoundingBox; conf: number }[]> = {
  'CAM-01': [{ type: 'pothole', bbox: { x: 0.4, y: 0.56, w: 0.22, h: 0.16 }, conf: 0.942 }],
  'CAM-02': [{ type: 'crack', bbox: { x: 0.3, y: 0.62, w: 0.36, h: 0.1 }, conf: 0.881 }],
  'CAM-04': [{ type: 'pothole', bbox: { x: 0.44, y: 0.54, w: 0.2, h: 0.15 }, conf: 0.951 }],
  'CAM-05': [{ type: 'damage', bbox: { x: 0.36, y: 0.5, w: 0.26, h: 0.18 }, conf: 0.936 }],
  'CAM-06': [{ type: 'pothole', bbox: { x: 0.5, y: 0.62, w: 0.14, h: 0.1 }, conf: 0.812 }],
};

/** Demo YOLO-n. Swap for ONNX / TensorRT edge runtime via RemoteYoloBackend. */
export class DemoYoloBackend implements YoloBackend {
  async infer(frame: FrameMeta) {
    const seeds = SEEDS[frame.cameraId] ?? SEEDS['CAM-01'];
    if (Math.random() < 0.08) return [];
    return seeds.map((s) => ({
      type: s.type,
      confidence: Math.max(0.72, Math.min(0.987, s.conf + (Math.random() - 0.5) * 0.04)),
      bbox: {
        x: jitter(s.bbox.x, 0.03),
        y: jitter(s.bbox.y, 0.025),
        w: Math.max(0.1, s.bbox.w + (Math.random() - 0.5) * 0.02),
        h: Math.max(0.08, s.bbox.h + (Math.random() - 0.5) * 0.02),
      },
    }));
  }
}

export class RemoteYoloBackend implements YoloBackend {
  constructor(private endpoint = '/v1/yolo/infer') {}
  async infer(_frame: FrameMeta): Promise<{ type: DefectType; confidence: number; bbox: BoundingBox }[]> {
    try {
      const res = await fetch(this.endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('yolo unavailable');
      return (await res.json()) as YoloBox[];
    } catch {
      return new DemoYoloBackend().infer(_frame);
    }
  }
}

export const yoloAPI = {
  backend: new DemoYoloBackend() as YoloBackend,
  demoMode: true,
  async infer(frame: FrameMeta) {
    return this.backend.infer(frame);
  },
};
