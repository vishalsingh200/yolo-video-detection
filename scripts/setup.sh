#!/bin/bash

# Setup script for YOLO Video Object Detection System

set -e

echo "🎥 YOLO Video Object Detection System - Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${BLUE}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
echo -e "${BLUE}Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate || . venv/Scripts/activate

# Upgrade pip
echo -e "${BLUE}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p videos
mkdir -p output
mkdir -p models
echo -e "${GREEN}✓ Directories created${NC}"

# Download sample video (optional)
echo -e "${BLUE}Would you like to download a sample video for testing? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}Downloading sample video...${NC}"
    # You can add a curl command here to download a sample video
    echo -e "${YELLOW}Please add your own video to the 'videos' folder${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "📚 Quick Start:"
echo ""
echo "1. List available object classes:"
echo -e "   ${BLUE}python main.py --list-classes${NC}"
echo ""
echo "2. Process a video (CLI):"
echo -e "   ${BLUE}python main.py --video videos/sample.mp4 --classes person car${NC}"
echo ""
echo "3. Launch GUI:"
echo -e "   ${BLUE}streamlit run app.py${NC}"
echo ""
echo "📖 For more information, see README.md"
echo ""
