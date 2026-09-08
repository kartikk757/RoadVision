import { Camera, Complaint, ComplaintEvent, Detection, EvidenceClip, Incident, LocationInfo, YoloBox } from '../lib/types';
import { isSupabaseConfigured, supabase } from '../utils/supabase';

const defaultPipeline = {
  detection: true,
  privacy: true,
  duplicate: true,
  location: true,
  authority: true,
  complaint: true,
  resolution: true,
};

function toCamera(row: any): Camera {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    position: row.position,
    route: row.route,
    status: row.status,
    fps: Number(row.fps ?? 0),
    lastActive: row.last_active ?? new Date().toISOString(),
    installedAt: row.installed_at ?? new Date().toISOString().slice(0, 10),
  };
}

function toLocation(row: any): LocationInfo {
  return {
    lat: Number(row.latitude ?? row.lat ?? 0),
    lng: Number(row.longitude ?? row.lng ?? 0),
    road: row.road ?? 'Unknown road',
    city: row.city ?? 'Unknown city',
    state: row.state ?? 'Unknown state',
    landmark: row.landmark ?? undefined,
    kmMarker: row.km_marker ?? undefined,
  };
}

function toIncident(row: any): Incident {
  return {
    id: row.id,
    type: row.type,
    confidence: Number(row.confidence ?? 0),
    severity: row.severity,
    status: row.status,
    location: toLocation(row),
    cameraId: row.camera_id,
    vehicleId: row.vehicle_id,
    timestamp: row.detected_at ?? new Date().toISOString(),
    approxSizeCm: Number(row.approx_size_cm ?? 0),
    detections: [],
    authority: row.authority ?? undefined,
    division: row.division ?? undefined,
    pipeline: row.pipeline ?? defaultPipeline,
    notes: row.notes ?? undefined,
  };
}

function toComplaintEvent(row: any): ComplaintEvent {
  return {
    status: row.status,
    at: row.created_at ?? new Date().toISOString(),
    note: row.note ?? '',
  };
}

function toComplaint(row: any): Complaint {
  const events = Array.isArray(row.complaint_events)
    ? row.complaint_events.map(toComplaintEvent)
    : [];

  return {
    id: row.id,
    incidentId: row.incident_id,
    authority: row.authority,
    division: row.division,
    status: row.status,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    events,
    resolutionNote: row.resolution_note ?? undefined,
  };
}

function toDetection(row: any): Detection {
  return {
    id: row.id,
    incidentId: row.incident_id,
    cameraId: row.camera_id,
    vehicleId: row.vehicle_id,
    type: row.type,
    confidence: Number(row.confidence ?? 0),
    severity: row.severity,
    bbox: row.bbox ?? { x: 0, y: 0, w: 0, h: 0 },
    timestamp: row.detected_at ?? new Date().toISOString(),
    fps: Number(row.fps ?? 0),
    approxSizeCm: Number(row.approx_size_cm ?? 0),
    location: toLocation(row),
  };
}

async function safeSelect<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn('Supabase query failed:', error.message ?? error);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchCameras(): Promise<Camera[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const rows = await safeSelect<any>(supabase.from('cameras').select('*').order('installed_at', { ascending: false }));
  return rows.map(toCamera);
}

export async function fetchIncidents(): Promise<Incident[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const rows = await safeSelect<any>(supabase.from('incidents').select('*').order('detected_at', { ascending: false }));
  return rows.map(toIncident);
}

export async function fetchComplaints(): Promise<Complaint[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const rows = await safeSelect<any>(
    supabase.from('complaints').select('*, complaint_events(*)').order('created_at', { ascending: false }),
  );
  return rows.map(toComplaint);
}

export async function fetchDetections(): Promise<Detection[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const rows = await safeSelect<any>(supabase.from('detections').select('*').order('detected_at', { ascending: false }));
  return rows.map(toDetection);
}

export async function fetchEvidenceStats(): Promise<{ clips: number; failed: number; kb: number }> {
  if (!isSupabaseConfigured || !supabase) return { clips: 0, failed: 0, kb: 0 };
  const rows = await safeSelect<any>(supabase.from('evidence').select('status, stored, size_kb'));
  const stored = rows.filter((row) => row.stored === true);
  return {
    clips: stored.length,
    failed: rows.filter((row) => row.status === 'failed').length,
    kb: stored.reduce((sum, row) => sum + Number(row.size_kb ?? 0), 0),
  };
}

export async function saveVehicleAndCamera(vehicle: { id: string; type: string; route: string }, camera: Camera): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const vehicleResult = await supabase.from('vehicles').upsert({
    id: vehicle.id,
    type: vehicle.type,
    route: vehicle.route,
  });
  if (vehicleResult.error) {
    if (vehicleResult.error.code === '42501') throw new Error('Supabase blocked vehicle creation by RLS. Run supabase/fix_upload_rls.sql in the SQL Editor, then retry.');
    throw new Error(vehicleResult.error.message);
  }
  const cameraResult = await supabase.from('cameras').upsert({
    id: camera.id,
    vehicle_id: camera.vehicleId,
    position: camera.position,
    route: camera.route,
    status: camera.status,
    fps: camera.fps,
    last_active: camera.lastActive,
    installed_at: camera.installedAt,
  });
  if (cameraResult.error) {
    if (cameraResult.error.code === '42501') throw new Error('Supabase blocked camera creation by RLS. Run supabase/fix_upload_rls.sql in the SQL Editor, then retry.');
    throw new Error(cameraResult.error.message);
  }
}

export async function updateCameraRecord(id: string, patch: Partial<Camera>): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const row = {
    ...(patch.vehicleId === undefined ? {} : { vehicle_id: patch.vehicleId }),
    ...(patch.position === undefined ? {} : { position: patch.position }),
    ...(patch.route === undefined ? {} : { route: patch.route }),
    ...(patch.status === undefined ? {} : { status: patch.status }),
    ...(patch.fps === undefined ? {} : { fps: patch.fps }),
    ...(patch.lastActive === undefined ? {} : { last_active: patch.lastActive }),
    ...(patch.installedAt === undefined ? {} : { installed_at: patch.installedAt }),
  };
  const result = await supabase.from('cameras').update(row).eq('id', id);
  if (result.error) throw new Error(result.error.message);
}

export async function createUploadedIncident(input: {
  mediaUri: string;
  mediaType: 'image' | 'video';
  location: LocationInfo;
  box: YoloBox;
  authority: string;
  division: string;
}): Promise<{ incidentId: string; complaintId: string }> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
  const suffix = Date.now().toString(36).toUpperCase();
  const vehicleId = `UPLOAD-${suffix}`;
  const cameraId = `UPLOAD-${suffix}`;
  const incidentId = `RV-UP-${suffix}`;
  const detectionId = `DET-UP-${suffix}`;
  const complaintId = `CMP-UP-${suffix}`;
  const now = new Date().toISOString();
  const vehicleResult = await supabase.from('vehicles').upsert({ id: vehicleId, type: 'Uploaded evidence', route: input.location.road });
  if (vehicleResult.error) throw new Error(vehicleResult.error.message);
  const cameraResult = await supabase.from('cameras').upsert({
    id: cameraId,
    vehicle_id: vehicleId,
    position: 'front',
    route: input.location.road,
    status: 'online',
    fps: 0,
    last_active: now,
    installed_at: now.slice(0, 10),
  });
  if (cameraResult.error) throw new Error(cameraResult.error.message);
  const severity = input.box.confidence >= 0.93 ? 'critical' : input.box.confidence >= 0.82 ? 'moderate' : 'low';
  const pipeline = { detection: true, privacy: true, duplicate: true, location: true, authority: true, complaint: true, resolution: false };
  const incidentResult = await supabase.from('incidents').insert({
    id: incidentId,
    type: input.box.type,
    confidence: input.box.confidence,
    severity,
    status: 'sent',
    latitude: input.location.lat,
    longitude: input.location.lng,
    road: input.location.road,
    city: input.location.city,
    state: input.location.state,
    landmark: input.location.landmark,
    camera_id: cameraId,
    vehicle_id: vehicleId,
    detected_at: now,
    approx_size_cm: 0,
    authority: input.authority,
    division: input.division,
    pipeline,
    notes: `Analyzed from uploaded ${input.mediaType}. Source: ${input.mediaUri}`,
  });
  if (incidentResult.error) throw new Error(incidentResult.error.message);
  const detectionResult = await supabase.from('detections').insert({
    id: detectionId,
    incident_id: incidentId,
    camera_id: cameraId,
    vehicle_id: vehicleId,
    type: input.box.type,
    confidence: input.box.confidence,
    severity,
    bbox: input.box.bbox,
    detected_at: now,
    fps: 0,
    approx_size_cm: 0,
  });
  if (detectionResult.error) throw new Error(detectionResult.error.message);
  const complaintResult = await supabase.from('complaints').insert({
    id: complaintId,
    incident_id: incidentId,
    authority: input.authority,
    division: input.division,
    status: 'sent',
  });
  if (complaintResult.error) throw new Error(complaintResult.error.message);
  const eventResult = await supabase.from('complaint_events').insert({
    complaint_id: complaintId,
    status: 'sent',
    note: `Complaint generated from uploaded ${input.mediaType} after AI analysis.`,
  });
  if (eventResult.error) throw new Error(eventResult.error.message);
  const evidenceResult = await supabase.from('evidence').insert({
    id: `EV-UP-${suffix}`,
    incident_id: incidentId,
    detection_id: detectionId,
    camera_id: cameraId,
    vehicle_id: vehicleId,
    complaint_id: complaintId,
    type: input.box.type,
    confidence: input.box.confidence,
    severity,
    bbox: input.box.bbox,
    captured_at: now,
    duration_sec: input.mediaType === 'video' ? 1 : 0,
    frames_used: input.mediaType === 'video' ? 1 : 0,
    buffer_window_sec: 0,
    privacy_applied: true,
    stored: false,
    status: 'privacy',
    note: `Uploaded ${input.mediaType} analyzed. Original media URI: ${input.mediaUri}`,
  });
  if (evidenceResult.error) throw new Error(evidenceResult.error.message);
  return { incidentId, complaintId };
}
