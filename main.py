"""
Main Application for YOLO Video Object Detection
"""
import argparse
import logging
from pathlib import Path
from typing import List,Dict
import sys

from src.yolo_detector import YOLODetector, YOLOModelManager
from src.video_processor import VideoProcessor, VideoInfo
from src.excel_exporter import ExcelExporter, CSVExporter, JSONExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('detection.log')
    ]
)
logger = logging.getLogger(__name__)

class VideoObjectDetectionApp:
    """Main application class"""
    
    def __init__(
        self,
        model_name: str = 'yolov8n.pt',
        confidence: float = 0.25,
        device: str = 'cpu'
    ):
        """Initialize application"""
        logger.info("Initializing Video Object Detection System")
        logger.info(f"Model: {model_name}, Confidence: {confidence}, Device: {device}")
        
        # Initialize detector
        self.detector = YOLODetector(
            model_name=model_name,
            confidence_threshold=confidence,
            device=device
        )
        
        # Initialize processor
        self.processor = VideoProcessor(self.detector)
        
        # Initialize exporters
        self.excel_exporter = ExcelExporter()
        self.csv_exporter = CSVExporter()
        self.json_exporter = JSONExporter()
        
        logger.info("System initialized successfully")
    
    def process_video(
        self,
        video_path: str,
        target_classes: List[str],
        output_dir: str = 'output',
        save_video: bool = True,
        export_excel: bool = True,
        export_csv: bool = False,
        export_json: bool = False,
        skip_frames: int = 0,
        max_frames: int = None
    ):
        """
        Process video and export results
        
        Args:
            video_path: Path to input video
            target_classes: List of object classes to detect
            output_dir: Output directory
            save_video: Save annotated video
            export_excel: Export to Excel
            export_csv: Export to CSV
            export_json: Export to JSON
            skip_frames: Skip frames (process every Nth frame)
            max_frames: Maximum frames to process
        """
        logger.info(f"Processing video: {video_path}")
        logger.info(f"Target classes: {target_classes}")
        
        # Validate classes
        valid_classes, invalid_classes = self.detector.validate_classes(target_classes)
        
        if invalid_classes:
            logger.warning(f"Invalid classes (will be ignored): {invalid_classes}")
        
        if not valid_classes:
            logger.error("No valid target classes provided")
            return
        
        logger.info(f"Valid classes: {valid_classes}")
        
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Get video name
        video_name = Path(video_path).stem
        
        # Prepare output paths
        output_video = None
        if save_video:
            output_video = str(output_path / f"{video_name}_detected.mp4")
        
        # Process video
        logger.info("Starting video processing...")
        results = self.processor.process_video(
            video_path=video_path,
            target_classes=valid_classes,
            output_video_path=output_video,
            skip_frames=skip_frames,
            max_frames=max_frames
        )
        
        # Export results
        if export_excel:
            excel_path = output_path / f"{video_name}_results.xlsx"
            logger.info(f"Exporting to Excel: {excel_path}")
            self.excel_exporter.export_to_excel(results, str(excel_path))
        
        if export_csv:
            csv_path = output_path / f"{video_name}_results.csv"
            logger.info(f"Exporting to CSV: {csv_path}")
            self.csv_exporter.export_to_csv(results, str(csv_path))
        
        if export_json:
            json_path = output_path / f"{video_name}_results.json"
            logger.info(f"Exporting to JSON: {json_path}")
            self.json_exporter.export_to_json(results, str(json_path))
        
        # Print summary
        self._print_summary(results)
        
        logger.info("Processing complete!")
        return results
    
    def _print_summary(self, results: Dict):
        """Print detection summary"""
        print("\n" + "="*60)
        print("DETECTION SUMMARY")
        print("="*60)
        
        stats = results['statistics']
        video_props = results['video_properties']
        
        print(f"\nVideo Information:")
        print(f"  Duration: {video_props['duration']:.2f} seconds")
        print(f"  Total Frames: {video_props['total_frames']}")
        print(f"  Frames Processed: {results['frames_processed']}")
        print(f"  FPS: {video_props['fps']:.2f}")
        print(f"  Resolution: {video_props['width']}x{video_props['height']}")
        
        print(f"\nDetection Statistics:")
        print(f"  Total Detections: {stats['total_detections']}")
        print(f"  Frames with Detections: {stats['frames_with_detections']}")
        
        print(f"\nPer-Class Statistics:")
        for cls in results['target_classes']:
            total = stats['class_totals'][cls]
            avg = stats['class_averages'][cls]
            max_count = stats['class_max'][cls]
            print(f"  {cls.title():15} - Total: {total:4}, Avg: {avg:5.2f}, Max: {max_count}")
        
        print("\n" + "="*60 + "\n")
    
    def list_available_classes(self):
        """List all available object classes"""
        classes = self.detector.get_available_classes()
        
        print("\n" + "="*60)
        print("AVAILABLE OBJECT CLASSES (80 classes)")
        print("="*60 + "\n")
        
        for i, cls in enumerate(classes, 1):
            print(f"{i:2}. {cls:20}", end='')
            if i % 3 == 0:
                print()
        
        print("\n" + "="*60 + "\n")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='YOLO Video Object Detection System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Detect people and cars
  python main.py --video sample.mp4 --classes person car
  
  # Use larger model for better accuracy
  python main.py --video sample.mp4 --classes person car --model yolov8m.pt
  
  # Process every 5th frame for faster processing
  python main.py --video sample.mp4 --classes person --skip-frames 4
  
  # List all available object classes
  python main.py --list-classes
        """
    )
    
    parser.add_argument(
        '--video',
        type=str,
        help='Path to input video file'
    )
    
    parser.add_argument(
        '--classes',
        nargs='+',
        help='Object classes to detect (e.g., person car bicycle)'
    )
    
    parser.add_argument(
        '--model',
        type=str,
        default='yolov8n.pt',
        choices=['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt', 'yolov8l.pt', 'yolov8x.pt'],
        help='YOLO model to use (default: yolov8n.pt - fastest)'
    )
    
    parser.add_argument(
        '--confidence',
        type=float,
        default=0.25,
        help='Confidence threshold (0.0-1.0, default: 0.25)'
    )
    
    parser.add_argument(
        '--device',
        type=str,
        default='cpu',
        choices=['cpu', 'cuda'],
        help='Device to run on (cpu or cuda)'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='output',
        help='Output directory (default: output)'
    )
    
    parser.add_argument(
        '--no-video',
        action='store_true',
        help='Do not save annotated video (faster)'
    )
    
    parser.add_argument(
        '--export-csv',
        action='store_true',
        help='Also export results to CSV'
    )
    
    parser.add_argument(
        '--export-json',
        action='store_true',
        help='Also export results to JSON'
    )
    
    parser.add_argument(
        '--skip-frames',
        type=int,
        default=0,
        help='Process every Nth frame (0 = all frames)'
    )
    
    parser.add_argument(
        '--max-frames',
        type=int,
        help='Maximum number of frames to process'
    )
    
    parser.add_argument(
        '--list-classes',
        action='store_true',
        help='List all available object classes'
    )
    
    args = parser.parse_args()
    
    # Initialize app
    app = VideoObjectDetectionApp(
        model_name=args.model,
        confidence=args.confidence,
        device=args.device
    )
    
    # List classes if requested
    if args.list_classes:
        app.list_available_classes()
        return
    
    # Validate required arguments
    if not args.video or not args.classes:
        parser.error("--video and --classes are required (unless using --list-classes)")
    
    # Process video
    app.process_video(
        video_path=args.video,
        target_classes=args.classes,
        output_dir=args.output,
        save_video=not args.no_video,
        export_excel=True,
        export_csv=args.export_csv,
        export_json=args.export_json,
        skip_frames=args.skip_frames,
        max_frames=args.max_frames
    )

if __name__ == '__main__':
    main()
