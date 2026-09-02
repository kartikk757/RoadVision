import { BoundingBox, DefectType, YoloBox } from './types';

export function iou(a: BoundingBox, b: BoundingBox): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

export interface Track {
  trackId: string;
  type: DefectType;
  bbox: BoundingBox;
  confidence: number;
  hits: number;
  missed: number;
  confirmed: boolean;
  captured: boolean;
  lastSeen: number;
}

let seq = 1;

export function createTracker() {
  const tracks: Track[] = [];

  function update(raw: { type: DefectType; confidence: number; bbox: BoundingBox }[], now: number): YoloBox[] {
    const used = new Set<number>();
    raw.forEach((det) => {
      let best = -1;
      let bestIou = 0.45;
      tracks.forEach((t, i) => {
        if (t.type !== det.type || used.has(i)) return;
        const v = iou(t.bbox, det.bbox);
        if (v > bestIou) {
          bestIou = v;
          best = i;
        }
      });
      if (best >= 0) {
        const t = tracks[best];
        used.add(best);
        t.bbox = det.bbox;
        t.confidence = det.confidence;
        t.hits += 1;
        t.missed = 0;
        t.lastSeen = now;
        if (t.hits >= 10) t.confirmed = true;
      } else {
        tracks.push({
          trackId: `TRK-${String(seq++).padStart(3, '0')}`,
          type: det.type,
          bbox: det.bbox,
          confidence: det.confidence,
          hits: 1,
          missed: 0,
          confirmed: false,
          captured: false,
          lastSeen: now,
        });
      }
    });
    tracks.forEach((t, i) => {
      if (!used.has(i)) t.missed += 1;
    });
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].missed > 12) tracks.splice(i, 1);
    }
    return tracks
      .filter((t) => t.missed < 4)
      .map((t) => ({
        id: t.trackId,
        trackId: t.trackId,
        type: t.type,
        confidence: t.confidence,
        bbox: t.bbox,
        label: `${t.type.toUpperCase()} · ${(t.confidence * 100).toFixed(1)}%`,
      }));
  }

  function markCaptured(trackId: string) {
    const t = tracks.find((x) => x.trackId === trackId);
    if (t) t.captured = true;
  }

  function readyToCapture(): Track[] {
    return tracks.filter((t) => t.confirmed && !t.captured && t.missed < 3);
  }

  function reset() {
    tracks.splice(0, tracks.length);
  }

  function list() {
    return tracks.slice();
  }

  return { update, markCaptured, readyToCapture, reset, list };
}
