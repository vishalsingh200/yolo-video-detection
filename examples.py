"""
Example Usage Scripts for YOLO Video Detection
"""

# Example 1: Basic detection
print("""
Example 1: Basic Person and Car Detection
==========================================
python main.py \\
  --video videos/traffic.mp4 \\
  --classes person car \\
  --output output/traffic_analysis
""")

# Example 2: Advanced detection with multiple options
print("""
Example 2: Advanced Multi-Object Detection
===========================================
python main.py \\
  --video videos/street.mp4 \\
  --classes person car bicycle motorcycle bus truck \\
  --model yolov8m.pt \\
  --confidence 0.4 \\
  --skip-frames 2 \\
  --export-csv \\
  --export-json
""")

# Example 3: Wildlife monitoring
print("""
Example 3: Wildlife Monitoring
===============================
python main.py \\
  --video videos/wildlife.mp4 \\
  --classes bird dog cat horse elephant zebra giraffe \\
  --model yolov8l.pt \\
  --skip-frames 10
""")

# Example 4: Security footage analysis
print("""
Example 4: Security Camera Analysis
====================================
python main.py \\
  --video videos/security.mp4 \\
  --classes person car bicycle \\
  --confidence 0.5 \\
  --max-frames 1000 \\
  --no-video
""")

# Example 5: Sports analysis
print("""
Example 5: Sports Event Analysis
=================================
python main.py \\
  --video videos/football.mp4 \\
  --classes person sports ball \\
  --model yolov8x.pt \\
  --confidence 0.3
""")

# Programmatic usage
print("""
Example 6: Programmatic Usage
==============================
from src.yolo_detector import YOLODetector
from src.video_processor import VideoProcessor
from src.excel_exporter import ExcelExporter

# Initialize detector
detector = YOLODetector(
    model_name='yolov8n.pt',
    confidence_threshold=0.25,
    device='cpu'
)

# Process video
processor = VideoProcessor(detector)
results = processor.process_video(
    video_path='input.mp4',
    target_classes=['person', 'car'],
    output_video_path='output.mp4'
)

# Export to Excel
exporter = ExcelExporter()
exporter.export_to_excel(results, 'results.xlsx')

# Print statistics
print(f"Total detections: {results['statistics']['total_detections']}")
""")
