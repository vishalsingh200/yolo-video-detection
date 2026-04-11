"""
YOLO Object Detection Engine
"""
import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Dict, Tuple, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class YOLODetector:
    """YOLO-based object detector for videos"""
    
    # COCO dataset classes (80 classes)
    COCO_CLASSES = [
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
        'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
        'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
        'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
        'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
        'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
        'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
        'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
        'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
        'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ]
    
    def __init__(
        self,
        model_name: str = 'yolov8n.pt',
        confidence_threshold: float = 0.25,
        device: str = 'cpu'
    ):
        """
        Initialize YOLO detector
        
        Args:
            model_name: YOLO model to use (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
            confidence_threshold: Minimum confidence for detections
            device: 'cpu' or 'cuda'
        """
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.device = device
        
        # Load YOLO model
        logger.info(f"Loading YOLO model: {model_name}")
        self.model = YOLO(model_name)
        self.model.to(device)
        
        logger.info(f"Model loaded on {device}")
        logger.info(f"Available classes: {len(self.COCO_CLASSES)}")
    
    def detect_objects(
        self,
        frame: np.ndarray,
        target_classes: Optional[List[str]] = None
    ) -> Dict[str, int]:
        """
        Detect objects in a single frame
        
        Args:
            frame: Input frame (BGR format)
            target_classes: List of target class names to detect (None = all classes)
            
        Returns:
            Dictionary mapping class names to counts
        """
        # Run inference
        results = self.model(frame, conf=self.confidence_threshold, verbose=False)[0]
        
        # Initialize counts
        object_counts = {}
        
        # Process detections
        if results.boxes is not None:
            for box in results.boxes:
                # Get class ID and name
                class_id = int(box.cls[0])
                class_name = self.COCO_CLASSES[class_id]
                
                # Filter by target classes if specified
                if target_classes is None or class_name in target_classes:
                    object_counts[class_name] = object_counts.get(class_name, 0) + 1
        
        return object_counts
    
    def detect_with_boxes(
        self,
        frame: np.ndarray,
        target_classes: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, Dict[str, int], List[Dict]]:
        """
        Detect objects and return annotated frame with bounding boxes
        
        Args:
            frame: Input frame
            target_classes: Target classes to detect
            
        Returns:
            Tuple of (annotated_frame, object_counts, detections_list)
        """
        # Run inference
        results = self.model(frame, conf=self.confidence_threshold, verbose=False)[0]
        
        # Get annotated frame
        annotated_frame = results.plot()
        
        # Process detections
        object_counts = {}
        detections = []
        
        if results.boxes is not None:
            for box in results.boxes:
                class_id = int(box.cls[0])
                class_name = self.COCO_CLASSES[class_id]
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].cpu().numpy()
                
                if target_classes is None or class_name in target_classes:
                    object_counts[class_name] = object_counts.get(class_name, 0) + 1
                    
                    detections.append({
                        'class': class_name,
                        'confidence': confidence,
                        'bbox': bbox.tolist(),
                        'center': [
                            (bbox[0] + bbox[2]) / 2,
                            (bbox[1] + bbox[3]) / 2
                        ]
                    })
        
        return annotated_frame, object_counts, detections
    
    def get_available_classes(self) -> List[str]:
        """Get list of all available object classes"""
        return self.COCO_CLASSES.copy()
    
    def validate_classes(self, target_classes: List[str]) -> Tuple[List[str], List[str]]:
        """
        Validate target class names
        
        Returns:
            Tuple of (valid_classes, invalid_classes)
        """
        valid_classes = []
        invalid_classes = []
        
        for cls in target_classes:
            if cls in self.COCO_CLASSES:
                valid_classes.append(cls)
            else:
                invalid_classes.append(cls)
        
        return valid_classes, invalid_classes

class YOLOModelManager:
    """Manage different YOLO model variants"""
    
    MODELS = {
        'yolov8n': {
            'name': 'YOLOv8 Nano',
            'file': 'yolov8n.pt',
            'speed': 'Fastest',
            'accuracy': 'Good',
            'size': '6 MB'
        },
        'yolov8s': {
            'name': 'YOLOv8 Small',
            'file': 'yolov8s.pt',
            'speed': 'Fast',
            'accuracy': 'Better',
            'size': '22 MB'
        },
        'yolov8m': {
            'name': 'YOLOv8 Medium',
            'file': 'yolov8m.pt',
            'speed': 'Medium',
            'accuracy': 'Great',
            'size': '52 MB'
        },
        'yolov8l': {
            'name': 'YOLOv8 Large',
            'file': 'yolov8l.pt',
            'speed': 'Slower',
            'accuracy': 'Excellent',
            'size': '87 MB'
        },
        'yolov8x': {
            'name': 'YOLOv8 Extra Large',
            'file': 'yolov8x.pt',
            'speed': 'Slowest',
            'accuracy': 'Best',
            'size': '136 MB'
        }
    }
    
    @classmethod
    def get_model_info(cls, model_key: str) -> Dict:
        """Get information about a model"""
        return cls.MODELS.get(model_key, cls.MODELS['yolov8n'])
    
    @classmethod
    def list_models(cls) -> Dict:
        """List all available models"""
        return cls.MODELS
