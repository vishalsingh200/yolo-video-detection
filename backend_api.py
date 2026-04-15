"""
FastAPI Backend for YOLO Video Detection Frontend
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import sys
import uuid
import json
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import logging

import numpy as np   # 👈 ADD THIS

# Add below imports
def convert_numpy(obj):
    """Recursively convert numpy types to native Python types."""
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    else:
        return obj

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.yolo_detector import YOLODetector
from src.video_processor import VideoProcessor
from src.excel_exporter import ExcelExporter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLO Video Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS_DIR = Path("jobs")
JOBS_DIR.mkdir(exist_ok=True)

jobs_db = {}

# ✅ Thread pool: offloads CPU-heavy YOLO processing to a thread
# so FastAPI's event loop stays free to answer status polling requests
_executor = ThreadPoolExecutor(max_workers=2)


@app.get("/")
async def root():
    return {"status": "healthy", "message": "YOLO Video Detection API"}


@app.get("/api/classes")
async def get_available_classes():
    try:
        detector = YOLODetector()
        classes = detector.get_available_classes()
        return {"classes": classes, "count": len(classes)}
    except Exception as e:
        logger.error(f"Error getting classes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models")
async def get_available_models():
    models = [
        {"id": "yolov8n", "name": "Nano",       "speed": "Fastest", "accuracy": "Good",      "size": "6 MB"},
        {"id": "yolov8s", "name": "Small",       "speed": "Fast",    "accuracy": "Better",    "size": "22 MB"},
        {"id": "yolov8m", "name": "Medium",      "speed": "Medium",  "accuracy": "Great",     "size": "52 MB"},
        {"id": "yolov8l", "name": "Large",       "speed": "Slower",  "accuracy": "Excellent", "size": "87 MB"},
        {"id": "yolov8x", "name": "Extra Large", "speed": "Slowest", "accuracy": "Best",      "size": "136 MB"},
    ]
    return {"models": models}


@app.post("/api/detect")
async def detect_objects(
    video: UploadFile = File(...),
    classes: str = Form(...),
    model: str = Form("yolov8n"),
    confidence: float = Form(0.25),
    device: str = Form("cpu"),
    skipFrames: int = Form(0),
    maxFrames: int = Form(0),
    saveVideo: bool = Form(True)
):
    try:
        job_id = str(uuid.uuid4())
        job_dir = JOBS_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        target_classes = json.loads(classes)

        video_path = job_dir / "input_video.mp4"
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        logger.info(f"Job {job_id}: uploaded {video_path.stat().st_size} bytes")

        jobs_db[job_id] = {
            "status": "queued",
            "progress": 0,
            "message": "Video uploaded, starting processing...",
        }

        # ✅ KEY FIX: run_in_executor keeps the event loop unblocked
        # Without this, BackgroundTasks would block ALL status poll responses
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            _executor,
            process_video_background,
            job_id, str(video_path), target_classes,
            model, confidence, device,
            skipFrames,
            maxFrames if maxFrames > 0 else None,
            saveVideo, job_dir
        )

        return {"job_id": job_id, "status": "queued", "message": "Processing started"}

    except Exception as e:
        logger.error(f"Error starting detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def process_video_background(
    job_id, video_path, target_classes,
    model, confidence, device,
    skip_frames, max_frames, save_video, job_dir
):
    try:
        jobs_db[job_id].update({
            "status": "processing",
            "progress": 5,
            "message": "Initializing YOLO..."
        })

        # Step 1: Load model
        detector = YOLODetector(
            model_name=f"{model}.pt",
            confidence_threshold=confidence,
            device=device
        )

        # Step 2: Create processor
        processor = VideoProcessor(detector)

        jobs_db[job_id].update({
            "progress": 10,
            "message": "Loading video..."
        })

        output_video_path = str(job_dir / "output_video.mp4") if save_video else None

        jobs_db[job_id].update({
            "progress": 15,
            "message": "Processing frames..."
        })

        # Step 3: Progress callback
        def update_progress(current, total):
            # progress = 15 + int((current / total) * 70)
            progress = int((current / total) * 100)
            jobs_db[job_id]["progress"] = progress
            jobs_db[job_id]["message"] = f"Processing frame {current}/{total}"

        # Step 4: Run YOLO
        results = processor.process_video(
            video_path=video_path,
            target_classes=target_classes,
            output_video_path=output_video_path,
            skip_frames=skip_frames,
            max_frames=max_frames,
            progress_callback=update_progress
        )

        # Step 5: Export files
        jobs_db[job_id]["progress"] = 90
        jobs_db[job_id]["message"] = "Exporting results..."

        excel_path = job_dir / "results.xlsx"
        ExcelExporter().export_to_excel(results, str(excel_path))

        from src.excel_exporter import CSVExporter
        csv_path = job_dir / "results.csv"
        CSVExporter.export_to_csv(results, str(csv_path))

        # Step 6: Fix numpy issue
        clean_results = convert_numpy(results)

        # Step 7: Save final result
        jobs_db[job_id].update({
            "status": "completed",
            "progress": 100,
            "message": "Processing complete!",
            "results": clean_results,
            "excel_path": str(excel_path),
            "csv_path": str(csv_path),
            "output_video_path": output_video_path,
        })

        logger.info(f"Job {job_id}: completed successfully")

    except Exception as e:
        logger.error(f"Job {job_id}: failed — {str(e)}")

        jobs_db[job_id].update({
            "status": "failed",
            "message": f"Error: {str(e)}"
        })

@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs_db[job_id]
    
    return {
    "job_id": job_id,
    "status": job["status"],
    "progress": job["progress"],
    "message": job.get("message", ""),
    "results": convert_numpy(job.get("results")) if job["status"] == "completed" else None,
}

    

@app.get("/api/download/{job_id}/excel")
async def download_excel(job_id: str):
    job = _get_completed_job(job_id)
    path = job.get("excel_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Excel file not found")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="detection_results.xlsx"
    )


@app.get("/api/download/{job_id}/csv")
async def download_csv(job_id: str):
    job = _get_completed_job(job_id)
    path = job.get("csv_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    return FileResponse(path, media_type="text/csv", filename="detection_results.csv")


@app.get("/api/download/{job_id}/video")
async def download_video(job_id: str):
    job = _get_completed_job(job_id)
    path = job.get("output_video_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path, media_type="video/mp4", filename="detected_video.mp4")


def _get_completed_job(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs_db[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    return job


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    job_dir = JOBS_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir)
    del jobs_db[job_id]
    return {"message": "Job deleted successfully"}


@app.get("/api/jobs")
async def list_jobs():
    jobs = [
        {"job_id": jid, "status": d["status"], "progress": d["progress"], "message": d.get("message", "")}
        for jid, d in jobs_db.items()
    ]
    return {"jobs": jobs, "count": len(jobs)}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting YOLO Detection Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)