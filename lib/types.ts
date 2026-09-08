export type Role = 'conductor' | 'admin' | 'authority';
export type Severity = 'critical' | 'moderate' | 'low' | 'resolved';
export type DefectType = 'pothole' | 'crack' | 'damage' | 'depression' | 'marking';
export type CameraStatus = 'online' | 'offline' | 'connecting' | 'testing';
export type ComplaintStatus =
  | 'detected'
  | 'verified'
  | 'authority_identified'
  | 'sent'
  | 'acknowledged'
  | 'pending'
  | 'resolved';

export type PipelineKey =
  | 'detection'
  | 'privacy'
  | 'duplicate'
  | 'location'
  | 'authority'
  | 'complaint'
  | 'resolution';

export type EvidenceStatus =
  | 'buffering'
  | 'tracking'
  | 'cropping'
  | 'privacy'
  | 'uploading'
  | 'stored'
  | 'failed';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  road: string;
  city: string;
  state: string;
  landmark?: string;
  kmMarker?: string;
}

export interface Camera {
  id: string;
  vehicleId: string;
  position: 'front' | 'rear' | 'left' | 'right';
  route: string;
  status: CameraStatus;
  fps: number;
  lastActive: string;
  installedAt: string;
}

export interface Detection {
  id: string;
  incidentId: string;
  cameraId: string;
  vehicleId: string;
  type: DefectType;
  confidence: number;
  severity: Severity;
  bbox: BoundingBox;
  timestamp: string;
  fps: number;
  approxSizeCm: number;
  location: LocationInfo;
}

export interface PipelineState {
  detection: boolean;
  privacy: boolean;
  duplicate: boolean;
  location: boolean;
  authority: boolean;
  complaint: boolean;
  resolution: boolean;
}

export interface DuplicateMatch {
  comparedId: string;
  cameraA: string;
  cameraB: string;
  detectionA: string;
  detectionB: string;
  similarity: number;
  sameIncident: boolean;
}

export interface Incident {
  id: string;
  type: DefectType;
  confidence: number;
  severity: Severity;
  status: ComplaintStatus;
  location: LocationInfo;
  cameraId: string;
  vehicleId: string;
  timestamp: string;
  approxSizeCm: number;
  detections: Detection[];
  duplicate?: DuplicateMatch;
  complaintId?: string;
  authority?: string;
  division?: string;
  pipeline: PipelineState;
  notes?: string;
}

export interface ComplaintEvent {
  status: ComplaintStatus;
  at: string;
  note: string;
}

export interface Complaint {
  id: string;
  incidentId: string;
  authority: string;
  division: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  events: ComplaintEvent[];
  resolutionNote?: string;
}

export interface User {
  name: string;
  role: Role;
  authority?: string;
  division?: string;
}

export interface Vehicle {
  id: string;
  type: string;
  route: string;
}

export interface YoloBox {
  id: string;
  trackId: string;
  type: DefectType;
  confidence: number;
  bbox: BoundingBox;
  label: string;
}

export interface FrameMeta {
  t: number;
  cameraId: string;
  boxes: YoloBox[];
}

export interface EvidenceClip {
  id: string;
  incidentId: string;
  detectionId: string;
  trackId: string;
  cameraId: string;
  vehicleId: string;
  complaintId?: string;
  type: DefectType;
  confidence: number;
  severity: Severity;
  bbox: BoundingBox;
  location: LocationInfo;
  capturedAt: string;
  durationSec: number;
  sizeKb: number;
  framesUsed: number;
  bufferWindowSec: number;
  privacyApplied: boolean;
  stored: boolean;
  status: EvidenceStatus;
  failureReason?: string;
  note: string;
}

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Home: undefined;
  Live: undefined;
  Map: undefined;
  Incidents: undefined;
  IncidentDetails: { id: string };
  Privacy: { id: string };
  Duplicate: { id: string };
  Complaints: undefined;
  ComplaintDetails: { id: string };
  Cameras: undefined;
  Analytics: undefined;
  Settings: undefined;
  Reports: undefined;
  Menu: undefined;
  EvidencePlayer: { id: string };
  UploadEvidence: undefined;
};
