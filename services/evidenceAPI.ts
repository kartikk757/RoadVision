import { EvidenceClip, YoloBox, LocationInfo, DefectType, Severity } from '../lib/types';
import { seedEvidence, storagePolicy } from '../lib/evidenceData';
import { privacyAPI } from './privacyAPI';
import { incidents } from '../lib/mockData';

let clips: EvidenceClip[] = seedEvidence.map((c) => ({ ...c }));
const listeners = new Set<() => void>();
let n = 200;

function emit() {
  listeners.forEach((fn) => fn());
}

export const evidenceAPI = {
  policy: storagePolicy,

  list(): EvidenceClip[] {
    return clips.slice().sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt));
  },

  get(id: string) {
    return clips.find((c) => c.id === id);
  },

  byIncident(incidentId: string) {
    return clips.filter((c) => c.incidentId === incidentId && c.status !== 'failed');
  },

  byComplaint(complaintId: string) {
    return clips.filter((c) => c.complaintId === complaintId && c.stored);
  },

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  stats() {
    const stored = clips.filter((c) => c.stored);
    const failed = clips.filter((c) => c.status === 'failed');
    const bytes = stored.reduce((s, c) => s + c.sizeKb, 0);
    return {
      clips: stored.length,
      failed: failed.length,
      kb: bytes,
      mb: bytes / 1024,
      fullStreamWouldMb: storagePolicy.fullStreamGbPerHour * 1024,
      savingsPct: 0.996,
      bufferSec: storagePolicy.bufferSec,
    };
  },

  async capture(opts: {
    trackId: string;
    cameraId: string;
    vehicleId: string;
    box: YoloBox;
    location: LocationInfo;
    bufferSec: number;
    framesUsed: number;
  }): Promise<EvidenceClip> {
    const inc = incidents.find((i) => i.cameraId === opts.cameraId) ?? incidents[0];
    const durationSec = Math.max(5, Math.min(8.5, opts.bufferSec * 0.8));
    let clip: EvidenceClip = {
      id: `EV-LIVE-${n++}`,
      incidentId: inc.id,
      detectionId: `DET-LIVE-${n}`,
      trackId: opts.trackId,
      cameraId: opts.cameraId,
      vehicleId: opts.vehicleId,
      complaintId: inc.complaintId,
      type: opts.box.type as DefectType,
      confidence: opts.box.confidence,
      severity: (opts.box.confidence > 0.93 ? 'critical' : opts.box.confidence > 0.85 ? 'moderate' : 'low') as Severity,
      bbox: opts.box.bbox,
      location: opts.location,
      capturedAt: new Date().toISOString(),
      durationSec,
      sizeKb: 0,
      framesUsed: opts.framesUsed,
      bufferWindowSec: opts.bufferSec,
      privacyApplied: false,
      stored: false,
      status: 'cropping',
      note: 'Cropped from RAM buffer. Full live stream is not stored.',
    };
    clips = [clip, ...clips];
    emit();

    await new Promise((r) => setTimeout(r, 280));
    clip = { ...clip, status: 'privacy' };
    clips = clips.map((c) => (c.id === clip.id ? clip : c));
    emit();

    await privacyAPI.anonymizeCrop(clip.id);
    clip = { ...clip, status: 'uploading', privacyApplied: true };
    clips = clips.map((c) => (c.id === clip.id ? clip : c));
    emit();

    await new Promise((r) => setTimeout(r, 360));
    const fail = Math.random() < 0.08;
    if (fail) {
      clip = {
        ...clip,
        status: 'failed',
        stored: false,
        failureReason: 'Cloud write failed. Crop retained for retry. No full footage exists.',
      };
    } else {
      clip = {
        ...clip,
        status: 'stored',
        stored: true,
        sizeKb: Math.round(durationSec * 260),
        note: 'Confirmed unique track. Cropped evidence stored. Buffer discarded.',
      };
    }
    clips = clips.map((c) => (c.id === clip.id ? clip : c));
    emit();
    return clip;
  },

  async retry(id: string) {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    let next = { ...clip, status: 'uploading' as const, failureReason: undefined };
    clips = clips.map((c) => (c.id === id ? next : c));
    emit();
    await new Promise((r) => setTimeout(r, 500));
    next = { ...next, status: 'stored', stored: true, sizeKb: Math.round(clip.durationSec * 260) };
    clips = clips.map((c) => (c.id === id ? next : c));
    emit();
    return next;
  },
};
