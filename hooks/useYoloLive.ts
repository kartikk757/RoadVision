import { useEffect, useRef, useState } from 'react';
import { FrameMeta, LocationInfo, YoloBox } from '../lib/types';
import { createTracker } from '../lib/yoloTracker';
import { yoloAPI } from '../services/yoloAPI';
import { evidenceAPI } from '../services/evidenceAPI';
import { detections } from '../lib/mockData';

const BUFFER_MS = 8000;
const TICK_MS = 90;

export interface CaptureEvent {
  id: string;
  message: string;
  status: 'ok' | 'warn' | 'fail';
  at: number;
  clipId?: string;
}

export function useYoloLive(opts: {
  enabled: boolean;
  cameraId: string;
  vehicleId: string;
}) {
  const [boxes, setBoxes] = useState<YoloBox[]>([]);
  const [inferFps, setInferFps] = useState(11);
  const [bufferSec, setBufferSec] = useState(0);
  const [events, setEvents] = useState<CaptureEvent[]>([]);
  const [capturing, setCapturing] = useState(false);
  const tracker = useRef(createTracker());
  const buffer = useRef<FrameMeta[]>([]);
  const frames = useRef(0);
  const lastFpsAt = useRef(Date.now());
  const capturingRef = useRef(false);

  useEffect(() => {
    tracker.current.reset();
    buffer.current = [];
    frames.current = 0;
    setBoxes([]);
    setBufferSec(0);
    if (!opts.enabled) {
      setEvents((prev) => [
        {
          id: `e-${Date.now()}`,
          message: 'RAM buffer discarded. No full footage was stored.',
          status: 'warn',
          at: Date.now(),
        },
        ...prev.slice(0, 5),
      ]);
    }
  }, [opts.cameraId, opts.enabled]);

  useEffect(() => {
    if (!opts.enabled) return;
    let alive = true;
    const loc: LocationInfo =
      detections.find((d) => d.cameraId === opts.cameraId)?.location ?? detections[0].location;

    const tick = async () => {
      if (!alive) return;
      const now = Date.now();
      const raw = await yoloAPI.infer({ t: now, cameraId: opts.cameraId, boxes: [] });
      if (!alive) return;
      const nextBoxes = tracker.current.update(raw, now);
      setBoxes(nextBoxes);
      buffer.current.push({ t: now, cameraId: opts.cameraId, boxes: nextBoxes });
      buffer.current = buffer.current.filter((f) => now - f.t <= BUFFER_MS);
      setBufferSec(Math.min(8, buffer.current.length * (TICK_MS / 1000)));
      frames.current += 1;
      if (now - lastFpsAt.current > 1000) {
        setInferFps(frames.current);
        frames.current = 0;
        lastFpsAt.current = now;
      }

      const ready = tracker.current.readyToCapture();
      if (ready.length && !capturingRef.current) {
        const track = ready[0];
        tracker.current.markCaptured(track.trackId);
        capturingRef.current = true;
        setCapturing(true);
        setEvents((prev) => [
          {
            id: `cap-${track.trackId}`,
            message: `Track ${track.trackId} confirmed · cropping ${buffer.current.length} buffered frames`,
            status: 'ok',
            at: Date.now(),
          },
          ...prev.slice(0, 6),
        ]);
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
            location: loc,
            bufferSec: Math.min(8, buffer.current.length * (TICK_MS / 1000)),
            framesUsed: buffer.current.length,
          })
          .then((clip) => {
            setEvents((prev) => [
              {
                id: `done-${clip.id}`,
                message:
                  clip.status === 'stored'
                    ? `Evidence ${clip.id} stored · ${clip.durationSec.toFixed(1)}s crop · ${(clip.sizeKb / 1024).toFixed(1)} MB`
                    : `Evidence upload failed · crop held for retry`,
                status: clip.status === 'stored' ? 'ok' : 'fail',
                at: Date.now(),
                clipId: clip.id,
              },
              ...prev.slice(0, 6),
            ]);
          })
          .finally(() => {
            capturingRef.current = false;
            setCapturing(false);
          });
      }
    };

    const id = setInterval(tick, TICK_MS);
    tick();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [opts.enabled, opts.cameraId, opts.vehicleId]);

  return {
    boxes,
    inferFps,
    bufferSec,
    events,
    capturing,
    demoMode: yoloAPI.demoMode,
    tracks: tracker.current.list(),
  };
}
