"""
FastAPI Backend for YOLO Video Detection Frontend
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import sys
import uuid
import json
import shutil
from pathlib import Path
import logging

# Add parent directory to path to import YOLO modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.yolo_detector import YOLODetector
from src.video_processor import VideoProcessor
from src.excel_exporter import ExcelExporter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="YOLO Video Detection API",
    description="API for video object detection using YOLO",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://thunderous-lamington-8050fb.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage for job results
JOBS_DIR = Path("jobs")
JOBS_DIR.mkdir(exist_ok=True)

# In-memory job storage
jobs_db = {}

# Pydantic models
class DetectionRequest(BaseModel):
    model: str = "yolov8n"
    confidence: float = 0.25
    device: str = "cpu"
    skipFrames: int = 0
    maxFrames: int = 0
    saveVideo: bool = True

class JobStatus(BaseModel):
    job_id: str
    status: str  # queued, processing, completed, failed
    progress: int
    message: Optional[str] = None
    results: Optional[Dict] = None

@app.get("/")
async def root():
    """Health check"""
    return {"status": "healthy", "message": "YOLO Video Detection API"}

@app.get("/api/classes")
async def get_available_classes():
    """Get list of available object classes"""
    try:
        detector = YOLODetector()
        classes = detector.get_available_classes()
        return {"classes": classes, "count": len(classes)}
    except Exception as e:
        logger.error(f"Error getting classes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_available_models():
    """Get list of available YOLO models"""
    models = [
        {
            "id": "yolov8n",
            "name": "Nano",
            "speed": "Fastest",
            "accuracy": "Good",
            "size": "6 MB"
        },
        {
            "id": "yolov8s",
            "name": "Small",
            "speed": "Fast",
            "accuracy": "Better",
            "size": "22 MB"
        },
        {
            "id": "yolov8m",
            "name": "Medium",
            "speed": "Medium",
            "accuracy": "Great",
            "size": "52 MB"
        },
        {
            "id": "yolov8l",
            "name": "Large",
            "speed": "Slower",
            "accuracy": "Excellent",
            "size": "87 MB"
        },
        {
            "id": "yolov8x",
            "name": "Extra Large",
            "speed": "Slowest",
            "accuracy": "Best",
            "size": "136 MB"
        }
    ]
    return {"models": models}

@app.post("/api/detect")
async def detect_objects(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    classes: str = Form(...),
    model: str = Form("yolov8n"),
    confidence: float = Form(0.25),
    device: str = Form("cpu"),
    skipFrames: int = Form(0),
    maxFrames: int = Form(0),
    saveVideo: bool = Form(True)
):
    """
    Upload video and start detection process
    """
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Create job directory
        job_dir = JOBS_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        
        # Parse classes
        target_classes = json.loads(classes)
        
        # Save uploaded video
        video_path = job_dir / "input_video.mp4"
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        logger.info(f"Job {job_id}: Video uploaded, size: {video_path.stat().st_size} bytes")
        
        # Initialize job status
        jobs_db[job_id] = {
            "status": "queued",
            "progress": 0,
            "message": "Video uploaded, starting processing...",
            "video_path": str(video_path),
            "target_classes": target_classes,
            "config": {
                "model": model,
                "confidence": confidence,
                "device": device,
                "skip_frames": skipFrames,
                "max_frames": maxFrames,
                "save_video": saveVideo
            }
        }
        
        # Start background processing
        background_tasks.add_task(
            process_video_background,
            job_id,
            str(video_path),
            target_classes,
            model,
            confidence,
            device,
            skipFrames,
            maxFrames if maxFrames > 0 else None,
            saveVideo,
            job_dir
        )
        
        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Processing started"
        }
        
    except Exception as e:
        logger.error(f"Error starting detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def process_video_background(
    job_id: str,
    video_path: str,
    target_classes: List[str],
    model: str,
    confidence: float,
    device: str,
    skip_frames: int,
    max_frames: Optional[int],
    save_video: bool,
    job_dir: Path
):
    """Background task to process video"""
    try:
        # Update status
        jobs_db[job_id]["status"] = "processing"
        jobs_db[job_id]["progress"] = 5
        jobs_db[job_id]["message"] = "Initializing YOLO detector..."
        
        logger.info(f"Job {job_id}: Initializing detector with model {model}")
        
        # Initialize detector
        detector = YOLODetector(
            model_name=f"{model}.pt",
            confidence_threshold=confidence,
            device=device
        )
        
        jobs_db[job_id]["progress"] = 10
        jobs_db[job_id]["message"] = "Loading video..."
        
        # Initialize processor
        processor = VideoProcessor(detector)
        
        # Prepare output paths
        output_video_path = None
        if save_video:
            output_video_path = str(job_dir / "output_video.mp4")
        
        jobs_db[job_id]["progress"] = 15
        jobs_db[job_id]["message"] = "Processing frames..."
        
        # Progress callback
        def update_progress(current, total):
            progress = 15 + int((current / total) * 70)  # 15% to 85%
            jobs_db[job_id]["progress"] = progress
            jobs_db[job_id]["message"] = f"Processing frame {current}/{total}"
            logger.info(f"Job {job_id}: Progress {progress}%")
        
        # Process video
        logger.info(f"Job {job_id}: Starting video processing")
        results = processor.process_video(
            video_path=video_path,
            target_classes=target_classes,
            output_video_path=output_video_path,
            skip_frames=skip_frames,
            max_frames=max_frames,
            progress_callback=update_progress
        )
        
        jobs_db[job_id]["progress"] = 90
        jobs_db[job_id]["message"] = "Exporting results to Excel..."
        
        # Export to Excel
        excel_path = job_dir / "results.xlsx"
        exporter = ExcelExporter()
        exporter.export_to_excel(results, str(excel_path))
        
        logger.info(f"Job {job_id}: Excel exported to {excel_path}")
        
        # Also export CSV for convenience
        from src.excel_exporter import CSVExporter
        csv_path = job_dir / "results.csv"
        CSVExporter.export_to_csv(results, str(csv_path))
        
        jobs_db[job_id]["progress"] = 100
        jobs_db[job_id]["status"] = "completed"
        jobs_db[job_id]["message"] = "Processing complete!"
        jobs_db[job_id]["results"] = results
        jobs_db[job_id]["excel_path"] = str(excel_path)
        jobs_db[job_id]["csv_path"] = str(csv_path)
        if output_video_path:
            jobs_db[job_id]["video_path"] = output_video_path
        
        logger.info(f"Job {job_id}: Processing completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id}: Error during processing: {str(e)}")
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["message"] = f"Error: {str(e)}"
        jobs_db[job_id]["error"] = str(e)

@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """Get status of detection job"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job.get("message", ""),
        "results": job.get("results") if job["status"] == "completed" else None
    }

@app.get("/api/download/{job_id}/excel")
async def download_excel(job_id: str):
    """Download Excel results"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    excel_path = job.get("excel_path")
    if not excel_path or not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="detection_results.xlsx"
    )

@app.get("/api/download/{job_id}/csv")
async def download_csv(job_id: str):
    """Download CSV results"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    csv_path = job.get("csv_path")
    if not csv_path or not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    return FileResponse(
        csv_path,
        media_type="text/csv",
        filename="detection_results.csv"
    )

@app.get("/api/download/{job_id}/video")
async def download_video(job_id: str):
    """Download annotated video"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    video_path = job.get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="detected_video.mp4"
    )

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete job and clean up files"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete job directory
    job_dir = JOBS_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir)
    
    # Remove from database
    del jobs_db[job_id]
    
    return {"message": "Job deleted successfully"}

@app.get("/api/jobs")
async def list_jobs():
    """List all jobs"""
    jobs = []
    for job_id, job_data in jobs_db.items():
        jobs.append({
            "job_id": job_id,
            "status": job_data["status"],
            "progress": job_data["progress"],
            "message": job_data.get("message", "")
        })
    
    return {"jobs": jobs, "count": len(jobs)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
