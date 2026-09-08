import os
import io
from pathlib import Path
from typing import Any

import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
MODEL_PATH = os.getenv('ROADVISION_MODEL_PATH', str(ROOT / 'best.pt'))
model = YOLO(MODEL_PATH)

CLASS_NAMES = {0: 'pothole', 1: 'crack', 2: 'manhole'}
app = FastAPI(title='RoadVision AI')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=False, allow_methods=['*'], allow_headers=['*'])
OUTPUT_DIR = ROOT / 'outputs'
OUTPUT_DIR.mkdir(exist_ok=True)
app.mount('/outputs', StaticFiles(directory=OUTPUT_DIR), name='outputs')


def normalize_box(box: list[float], width: int, height: int) -> dict[str, float]:
    x1, y1, x2, y2 = box
    return {
        'x': max(0, min(1, x1 / width)),
        'y': max(0, min(1, y1 / height)),
        'w': max(0, min(1, (x2 - x1) / width)),
        'h': max(0, min(1, (y2 - y1) / height)),
    }


def infer_frame(frame: Any) -> list[dict[str, Any]]:
    height, width = frame.shape[:2]
    scale = min(1, 960 / max(width, height))
    if scale < 1:
        frame = cv2.resize(frame, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
        height, width = frame.shape[:2]
    results = model.predict(source=frame, conf=0.25, imgsz=640, verbose=False)
    detections = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            detections.append({
                'class_id': class_id,
                'class': CLASS_NAMES.get(class_id, 'unknown'),
                'confidence': round(float(box.conf[0]), 3),
                'bbox': normalize_box(box.xyxy[0].tolist(), width, height),
            })
    return detections


@app.get('/api/health')
def health():
    return {'status': 'healthy', 'model': Path(MODEL_PATH).name, 'classes': CLASS_NAMES}


@app.post('/api/detect')
async def detect(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    frame = cv2.cvtColor(__import__('numpy').array(image), cv2.COLOR_RGB2BGR)
    detections = infer_frame(frame)
    return {'success': True, 'total': len(detections), 'detections': detections}


@app.post('/api/detect-video')
async def detect_video(file: UploadFile = File(...)):
    temp_path = ROOT / 'upload-video.mp4'
    temp_path.write_bytes(await file.read())
    cap = cv2.VideoCapture(str(temp_path))
    if not cap.isOpened():
        return {'success': False, 'error': 'Could not open uploaded video'}

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    sample_every = max(1, int(total_frames / 24))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 360)
    output_path = OUTPUT_DIR / f'annotated_{os.urandom(8).hex()}.mp4'
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
    sampled_frames = 0
    counts = {'pothole': 0, 'crack': 0, 'manhole': 0}
    representatives: dict[str, dict[str, Any]] = {}
    current_detections: list[dict[str, Any]] = []
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_index % sample_every == 0:
            sampled_frames += 1
            current_detections = infer_frame(frame)
            for detection in current_detections:
                name = detection['class']
                if name in counts:
                    counts[name] += 1
                    representatives.setdefault(name, detection)
        for detection in current_detections:
            bbox = detection['bbox']
            x1 = int(bbox['x'] * width)
            y1 = int(bbox['y'] * height)
            x2 = int((bbox['x'] + bbox['w']) * width)
            y2 = int((bbox['y'] + bbox['h']) * height)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (40, 210, 90), 3)
            cv2.putText(frame, f"{detection['class']} {detection['confidence']:.2f}", (x1, max(24, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 210, 90), 2)
        writer.write(frame)
        frame_index += 1

    cap.release()
    writer.release()
    try:
        temp_path.unlink()
    except OSError:
        pass

    detections = list(representatives.values())
    return {
        'success': True,
        'message': 'video sampled and analyzed',
        'detections': detections,
        'counts': counts,
        'frames_processed': sampled_frames,
        'total_frames': total_frames,
        'sample_interval_frames': sample_every,
        'preview_url': f'/outputs/{output_path.name}',
    }
