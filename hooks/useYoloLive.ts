import { useCallback, useEffect, useRef, useState } from 'react';
import { FrameMeta, LocationInfo, YoloBox } from '../lib/types';
import { createTracker } from '../lib/yoloTracker';
import { Inference } from '../services/yoloAPI';
import { evidenceAPI } from '../services/evidenceAPI';
import { detections } from '../lib/mockData';

const BUFFER_MS = 8000;

export interface CaptureEvent {
  id: string;
  message: string;
  status: 'ok' | 'warn' | 'fail';
  at: number;
  clipId?: string;
}

export function useYoloLive(opts: { enabled: boolean; cameraId: string; vehicleId: string }) {
  const [boxes, setBoxes] = useState<YoloBox[]>([]);
  const [inferFps, setInferFps] = useState(0);
  const [bufferSec, setBufferSec] = useState(0);
  const [events, setEvents] = useState<CaptureEvent[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const tracker = useRef(createTracker());
  const buffer = useRef<FrameMeta[]>([]);
  const capturingRef = useRef(false);

  useEffect(() => {
    tracker.current.reset();
    buffer.current = [];
    setBoxes([]);
    setBufferSec(0);
    setInferFps(0);
    setServerError(undefined);
  }, [opts.cameraId]);

  useEffect(() => {
    if (opts.enabled) return;
    buffer.current = [];
    setBufferSec(0);
  }, [opts.enabled]);

  const reportError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Could not reach the YOLO server.';
    setServerError(message);
  }, []);

  const ingest = useCallback((raw: Inference[], elapsedMs: number) => {
    if (!opts.enabled) return;
    const now = Date.now();
    const nextBoxes = tracker.current.update(raw, now);
    const location: LocationInfo = detections.find((detection) => detection.cameraId === opts.cameraId)?.location ?? detections[0].location;
    setBoxes(nextBoxes);
    setInferFps(Math.max(1, Math.round(1000 / Math.max(1, elapsedMs))));
    setServerError(undefined);
    buffer.current.push({ t: now, cameraId: opts.cameraId, boxes: nextBoxes });
    buffer.current = buffer.current.filter((frame) => now - frame.t <= BUFFER_MS);
    setBufferSec(buffer.current.length > 1 ? Math.min(8, (now - buffer.current[0].t) / 1000) : 0);

    const ready = tracker.current.readyToCapture();
    if (!ready.length || capturingRef.current) return;

    const track = ready[0];
    tracker.current.markCaptured(track.trackId);
    capturingRef.current = true;
    setCapturing(true);
    setEvents((previous) => [{ id: `cap-${track.trackId}`, message: `Track ${track.trackId} confirmed · preserving the last ${buffer.current.length} analyzed frames`, status: 'ok', at: now }, ...previous.slice(0, 6)]);
    const box: YoloBox = {
      id: track.trackId,
      trackId: track.trackId,
      type: track.type,
      confidence: track.confidence,
      bbox: track.bbox,
      label: `${track.type.toUpperCase()} · ${(track.confidence * 100).toFixed(1)}%`,
    };
    evidenceAPI
      .capture({
        trackId: track.trackId,
        cameraId: opts.cameraId,
        vehicleId: opts.vehicleId,
        box,
        location,
        bufferSec: buffer.current.length > 1 ? Math.min(8, (now - buffer.current[0].t) / 1000) : 0,
        framesUsed: buffer.current.length,
      })
      .then((clip) => {
        setEvents((previous) => [{
          id: `done-${clip.id}`,
          message: clip.status === 'stored' ? `Evidence ${clip.id} stored · ${clip.durationSec.toFixed(1)}s crop` : 'Evidence upload failed · crop held for retry',
          status: clip.status === 'stored' ? 'ok' : 'fail',
          at: Date.now(),
          clipId: clip.id,
        }, ...previous.slice(0, 6)]);
      })
      .finally(() => {
        capturingRef.current = false;
        setCapturing(false);
      });
  }, [opts.cameraId, opts.enabled, opts.vehicleId]);

  return { boxes, inferFps, bufferSec, events, capturing, serverError, ingest, reportError, tracks: tracker.current.list() };
}
