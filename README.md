# 🎥 YOLO Video Object Detection System

An **AI-powered computer vision system** that processes video input to detect and analyze objects using the **YOLO (You Only Look Once)** algorithm.

![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)
![YOLO](https://img.shields.io/badge/YOLO-v8-orange?style=for-the-badge)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8-green?style=for-the-badge&logo=opencv)
![PyTorch](https://img.shields.io/badge/PyTorch-2.1-red?style=for-the-badge&logo=pytorch)

## ✨ Features

- 🎯 **Real-time Object Detection**: Frame-by-frame analysis using YOLOv8
- 📊 **Excel Export**: Structured results in tabular format
- 🎨 **Visual Output**: Annotated videos with bounding boxes
- 📈 **Statistical Analysis**: Per-class counts, averages, and maximums
- 🖥️ **Dual Interface**: Command-line and Streamlit GUI
- 🚀 **Multiple YOLO Models**: From Nano (fastest) to Extra Large (most accurate)
- 🎯 **80 Object Classes**: Detect people, vehicles, animals, and more
- ⚡ **Performance Options**: Skip frames, limit processing for faster results

## 🏗️ Architecture

```
Video Input → Frame Extraction → YOLO Detection → Analysis → Excel Export
                                       ↓
                              Bounding Boxes
                                       ↓
                              Annotated Video
```

## 📦 Installation

### Prerequisites

- Python 3.9+
- CUDA (optional, for GPU acceleration)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd yolo-video-detection
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will automatically download the YOLOv8 model on first run.

## 🚀 Quick Start

### Command Line Interface

```bash
# Detect people and cars in a video
python main.py --video sample.mp4 --classes person car

# Use a larger model for better accuracy
python main.py --video sample.mp4 --classes person car --model yolov8m.pt

# Process every 5th frame for faster results
python main.py --video sample.mp4 --classes person --skip-frames 4

# List all available object classes
python main.py --list-classes
```

### Streamlit GUI

```bash
streamlit run app.py
```

Then open http://localhost:8501 in your browser.

## 📖 Usage

### CLI Examples

#### Basic Detection

```bash
python main.py \
  --video input.mp4 \
  --classes person car bicycle \
  --output results/
```

**Output:**
- `results/input_detected.mp4` - Annotated video
- `results/input_results.xlsx` - Excel report
- `detection.log` - Processing log

#### Advanced Options

```bash
python main.py \
  --video traffic.mp4 \
  --classes person car bus truck motorcycle \
  --model yolov8l.pt \
  --confidence 0.4 \
  --skip-frames 2 \
  --export-csv \
  --export-json
```

**Parameters:**
- `--model`: YOLO model (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
- `--confidence`: Detection threshold (0.0-1.0, default: 0.25)
- `--skip-frames`: Process every Nth frame (0 = all frames)
- `--max-frames`: Limit number of frames
- `--no-video`: Skip video output (faster)
- `--device`: Use 'cuda' for GPU acceleration

### GUI Workflow

1. **Select Model**: Choose between speed and accuracy
2. **Upload Video**: Drag and drop or browse
3. **Choose Objects**: Select target classes
4. **Configure Settings**: Set confidence and options
5. **Start Detection**: Click to process
6. **Download Results**: Get Excel and video files

## 📊 Output Formats

### Excel Report

The Excel file contains two sheets:

**Detections Sheet:**

| Frame | Timestamp (s) | Total Objects | Person | Car | Bicycle |
|-------|---------------|---------------|--------|-----|---------|
| 0     | 0.00          | 5             | 3      | 2   | 0       |
| 1     | 0.04          | 6             | 4      | 1   | 1       |
| 2     | 0.08          | 4             | 2      | 2   | 0       |

**Summary Sheet:**
- Video metadata (duration, FPS, resolution)
- Total detections
- Per-class statistics
- Detection rate

### CSV Export

Same tabular format as Excel, but in CSV format for easy import into other tools.

### JSON Export

Complete detection data including:
- Frame-by-frame counts
- Bounding box coordinates
- Confidence scores
- Video properties

## 🎯 Supported Objects (80 Classes)

### Vehicles
car, bicycle, motorcycle, airplane, bus, train, truck, boat

### People & Animals
person, bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe

### Common Objects
chair, couch, bed, dining table, toilet, tv, laptop, mouse, keyboard, cell phone, bottle, cup, fork, knife, spoon, bowl

### And 58 more...

Use `python main.py --list-classes` to see all 80 classes.

## 🧪 Examples

### Traffic Analysis

```bash
python main.py \
  --video traffic.mp4 \
  --classes car bus truck motorcycle person \
  --confidence 0.3
```

**Use Case:** Count vehicles and pedestrians in traffic footage.

### Wildlife Monitoring

```bash
python main.py \
  --video wildlife.mp4 \
  --classes bird dog cat horse elephant \
  --skip-frames 10
```

**Use Case:** Detect animals in nature videos.

### Security Footage

```bash
python main.py \
  --video security.mp4 \
  --classes person car bicycle \
  --confidence 0.5 \
  --max-frames 1000
```

**Use Case:** Monitor entrances and parking areas.

## 🔧 YOLO Models Comparison

| Model | Speed | Accuracy | Size | Use Case |
|-------|-------|----------|------|----------|
| YOLOv8n | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | 6 MB | Real-time, testing |
| YOLOv8s | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 22 MB | Balanced |
| YOLOv8m | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 52 MB | Good quality |
| YOLOv8l | ⚡⚡ | ⭐⭐⭐⭐⭐ | 87 MB | High accuracy |
| YOLOv8x | ⚡ | ⭐⭐⭐⭐⭐ | 136 MB | Best quality |

## 📈 Performance

### Benchmarks (on CPU)

- **YOLOv8n**: ~30 FPS (1080p video)
- **YOLOv8m**: ~15 FPS (1080p video)
- **YOLOv8x**: ~5 FPS (1080p video)

### With GPU (CUDA)

- **YOLOv8n**: ~120 FPS
- **YOLOv8m**: ~60 FPS
- **YOLOv8x**: ~25 FPS

### Optimization Tips

1. **Use smaller model** (yolov8n) for real-time
2. **Skip frames** (`--skip-frames 4`) for faster processing
3. **Lower confidence** for more detections
4. **Use GPU** if available (`--device cuda`)
5. **Disable video output** (`--no-video`) when only analyzing

## 🖼️ Project Structure

```
yolo-video-detection/
├── src/
│   ├── yolo_detector.py      # YOLO detection engine
│   ├── video_processor.py    # Video processing
│   └── excel_exporter.py     # Export functionality
├── models/                    # YOLO models (auto-downloaded)
├── videos/                    # Input videos
├── output/                    # Results (videos, Excel)
├── main.py                    # CLI application
├── app.py                     # Streamlit GUI
├── requirements.txt           # Dependencies
└── README.md                  # This file
```

## 🐛 Troubleshooting

### Issue: "No module named 'ultralytics'"

```bash
pip install ultralytics
```

### Issue: "CUDA out of memory"

Use CPU instead:
```bash
python main.py --video input.mp4 --classes person --device cpu
```

Or use smaller model:
```bash
python main.py --video input.mp4 --classes person --model yolov8n.pt
```

### Issue: "Video file not found"

Ensure video path is correct:
```bash
python main.py --video "C:/path/to/video.mp4" --classes person
```

### Issue: Slow processing

Options to speed up:
1. Use smaller model (`yolov8n.pt`)
2. Skip frames (`--skip-frames 5`)
3. Limit frames (`--max-frames 500`)
4. Disable video output (`--no-video`)

## 🔒 System Requirements

### Minimum
- Python 3.9+
- 8GB RAM
- 2GB disk space

### Recommended
- Python 3.10+
- 16GB RAM
- NVIDIA GPU with 4GB+ VRAM
- 5GB disk space

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the documentation

## 🙏 Acknowledgments

- **Ultralytics**: YOLOv8 implementation
- **OpenCV**: Video processing
- **PyTorch**: Deep learning framework
- **Streamlit**: Web interface

---

**Built with ❤️ using YOLO, OpenCV, and Python**
