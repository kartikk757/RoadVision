# RoadVision

## AI endpoint

Set `EXPO_PUBLIC_YOLO_ENDPOINT` in `.env.local` to a reachable server's `/api/detect` endpoint. The MVP sends real multipart camera and evidence frames to that endpoint:

- Live Monitor captures a low-resolution back-camera frame about once per second and draws the returned boxes on the real preview.
- Upload Evidence sends an image to `/api/detect`, or a video to `/api/detect-video`, and creates the complaint from the detected result.
- The API response contains `{ "detections": [] }`; each detection has a class, confidence, and bounding box. The app maps the trained `manhole` class to RoadVision's `damage` category.

Supported defect types are `pothole`, `crack`, `damage`, `depression`, and `marking`.

### Local trained YOLO server

`ai_server/best.pt` is the model supplied in `RoadGaurdAI.zip`. Start its FastAPI service on the same port configured in `.env.local`:

```powershell
ai_server\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001
```

For a physical phone, use the computer's LAN IP—not `localhost`—in `.env.local`, then restart Expo. Verify it with `http://YOUR_LAN_IP:8001/api/health` before opening Live Monitor.
