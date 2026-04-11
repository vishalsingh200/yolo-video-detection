"""
Video Processing Engine
"""
import cv2
import numpy as np
from typing import List, Dict, Optional, Callable
from pathlib import Path
import logging
from tqdm import tqdm
from src.yolo_detector import YOLODetector

logger = logging.getLogger(__name__)

class VideoProcessor:
    """Process videos for object detection"""
    
    def __init__(self, detector: YOLODetector):
        """
        Initialize video processor
        
        Args:
            detector: YOLODetector instance
        """
        self.detector = detector
    
    def process_video(
        self,
        video_path: str,
        target_classes: List[str],
        output_video_path: Optional[str] = None,
        skip_frames: int = 0,
        max_frames: Optional[int] = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict:
        """
        Process video and detect objects frame by frame
        
        Args:
            video_path: Path to input video
            target_classes: List of object classes to detect
            output_video_path: Path to save annotated video (optional)
            skip_frames: Process every Nth frame (0 = all frames)
            max_frames: Maximum number of frames to process
            progress_callback: Callback function for progress updates
            
        Returns:
            Dictionary containing detection results
        """
        # Open video
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"Video properties: {width}x{height} @ {fps} FPS, {total_frames} frames")
        
        # Setup output video writer
        out = None
        if output_video_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        # Initialize results storage
        frame_results = []
        frame_count = 0
        processed_count = 0
        
        # Process frames
        with tqdm(total=total_frames, desc="Processing video") as pbar:
            while True:
                ret, frame = cap.read()
                
                if not ret:
                    break
                
                # Check max frames limit
                if max_frames and processed_count >= max_frames:
                    break
                
                # Skip frames if specified
                if skip_frames > 0 and frame_count % (skip_frames + 1) != 0:
                    frame_count += 1
                    pbar.update(1)
                    continue
                
                # Detect objects
                if output_video_path:
                    annotated_frame, counts, detections = self.detector.detect_with_boxes(
                        frame, target_classes
                    )
                    out.write(annotated_frame)
                else:
                    counts = self.detector.detect_objects(frame, target_classes)
                    detections = []
                
                # Store results
                frame_data = {
                    'frame_number': frame_count,
                    'timestamp': frame_count / fps,
                    'counts': counts,
                    'detections': detections
                }
                frame_results.append(frame_data)
                
                processed_count += 1
                frame_count += 1
                pbar.update(1)
                
                # Progress callback
                if progress_callback:
                    progress_callback(frame_count, total_frames)
        
        # Cleanup
        cap.release()
        if out:
            out.release()
        
        # Calculate statistics
        stats = self._calculate_statistics(frame_results, target_classes)
        
        results = {
            'video_path': video_path,
            'video_properties': {
                'width': width,
                'height': height,
                'fps': fps,
                'total_frames': total_frames,
                'duration': total_frames / fps
            },
            'target_classes': target_classes,
            'frames_processed': processed_count,
            'frame_results': frame_results,
            'statistics': stats,
            'output_video': output_video_path
        }
        
        logger.info(f"Processed {processed_count} frames")
        return results
    
    def _calculate_statistics(
        self,
        frame_results: List[Dict],
        target_classes: List[str]
    ) -> Dict:
        """Calculate detection statistics"""
        
        stats = {
            'total_detections': 0,
            'class_totals': {},
            'class_averages': {},
            'class_max': {},
            'frames_with_detections': 0
        }
        
        # Initialize class counters
        for cls in target_classes:
            stats['class_totals'][cls] = 0
            stats['class_max'][cls] = 0
        
        # Aggregate counts
        for frame_data in frame_results:
            counts = frame_data['counts']
            
            if counts:
                stats['frames_with_detections'] += 1
            
            for cls in target_classes:
                count = counts.get(cls, 0)
                stats['class_totals'][cls] += count
                stats['total_detections'] += count
                stats['class_max'][cls] = max(stats['class_max'][cls], count)
        
        # Calculate averages
        num_frames = len(frame_results)
        for cls in target_classes:
            stats['class_averages'][cls] = stats['class_totals'][cls] / num_frames if num_frames > 0 else 0
        
        return stats
    
    def extract_frames(
        self,
        video_path: str,
        output_dir: str,
        frame_interval: int = 30
    ) -> List[str]:
        """
        Extract frames from video at regular intervals
        
        Args:
            video_path: Path to video
            output_dir: Directory to save frames
            frame_interval: Extract every Nth frame
            
        Returns:
            List of saved frame paths
        """
        cap = cv2.VideoCapture(video_path)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        frame_paths = []
        frame_count = 0
        saved_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                frame_path = output_path / f"frame_{saved_count:05d}.jpg"
                cv2.imwrite(str(frame_path), frame)
                frame_paths.append(str(frame_path))
                saved_count += 1
            
            frame_count += 1
        
        cap.release()
        logger.info(f"Extracted {saved_count} frames to {output_dir}")
        
        return frame_paths

class VideoInfo:
    """Get video information without processing"""
    
    @staticmethod
    def get_video_info(video_path: str) -> Dict:
        """Get basic video information"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        info = {
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'total_frames': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'duration': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) / cap.get(cv2.CAP_PROP_FPS),
            'codec': int(cap.get(cv2.CAP_PROP_FOURCC))
        }
        
        cap.release()
        return info
    
    @staticmethod
    def get_first_frame(video_path: str) -> np.ndarray:
        """Get first frame of video"""
        cap = cv2.VideoCapture(video_path)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            raise ValueError("Cannot read first frame")
        
        return frame
