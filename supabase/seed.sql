INSERT INTO public.vehicles (id, type, route)
VALUES
  ('BUS-204', 'Bus', 'NH-27'),
  ('BUS-118', 'Bus', 'MG Road'),
  ('BUS-332', 'Bus', 'Airport Road'),
  ('BUS-441', 'Bus', 'AB Road')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cameras (id, vehicle_id, position, route, status, fps, last_active, installed_at)
VALUES
  ('CAM-01', 'BUS-204', 'front', 'NH-27', 'online', 24, now(), current_date),
  ('CAM-02', 'BUS-118', 'front', 'MG Road', 'online', 22, now(), current_date),
  ('CAM-05', 'BUS-332', 'front', 'Airport Road', 'online', 23, now(), current_date),
  ('CAM-06', 'BUS-441', 'front', 'AB Road', 'online', 25, now(), current_date)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.incidents (
  id, type, confidence, severity, status, latitude, longitude, road, city, state,
  landmark, km_marker, camera_id, vehicle_id, detected_at, approx_size_cm,
  authority, division, pipeline, notes
)
VALUES
  (
    'RV-1024', 'pothole', 0.96, 'critical', 'detected',
    22.7532, 75.8937, 'NH-27', 'Indore', 'Madhya Pradesh',
    'Super Corridor', '14.2', 'CAM-01', 'BUS-204',
    now() - interval '2 minutes', 48,
    'Public Works Department', 'Indore Division 4',
    '{"detection":true,"privacy":true,"duplicate":true,"location":true,"authority":true,"complaint":true,"resolution":false}',
    'Large pothole near the corridor.'
  ),
  (
    'RV-1025', 'crack', 0.88, 'moderate', 'verified',
    22.7196, 75.8577, 'MG Road', 'Indore', 'Madhya Pradesh',
    'Palasia Square', null, 'CAM-02', 'BUS-118',
    now() - interval '18 minutes', 210,
    'Indore Municipal Corporation', 'Zone 8 — Palasia',
    '{"detection":true,"privacy":true,"duplicate":true,"location":true,"authority":true,"complaint":true,"resolution":false}',
    'Road crack identified near the square.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.detections (
  id, incident_id, camera_id, vehicle_id, type, confidence, severity, bbox, detected_at, fps, approx_size_cm
)
VALUES
  ('DET-2041', 'RV-1024', 'CAM-01', 'BUS-204', 'pothole', 0.96, 'critical',
   '{"x":0.42,"y":0.58,"w":0.22,"h":0.16}', now() - interval '2 minutes', 24, 48),
  ('DET-2050', 'RV-1025', 'CAM-02', 'BUS-118', 'crack', 0.88, 'moderate',
   '{"x":0.30,"y":0.62,"w":0.38,"h":0.10}', now() - interval '18 minutes', 22, 210)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaints (id, incident_id, authority, division, status, resolution_note)
VALUES
  ('CMP-1001', 'RV-1024', 'Public Works Department', 'Indore Division 4', 'acknowledged', null),
  ('CMP-1002', 'RV-1025', 'Indore Municipal Corporation', 'Zone 8 — Palasia', 'sent', null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaint_events (complaint_id, status, note)
VALUES
  ('CMP-1001', 'detected', 'AI detection created the complaint.'),
  ('CMP-1001', 'acknowledged', 'Authority acknowledged the report.'),
  ('CMP-1002', 'detected', 'Wall crack detected and routed.'),
  ('CMP-1002', 'sent', 'Complaint sent to authority.')
ON CONFLICT DO NOTHING;