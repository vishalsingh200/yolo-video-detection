
import React, { useState, useEffect, useRef } from 'react';
import { Video, Sparkles, Check, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoUpload from './components/VideoUpload';
import ObjectClassSelector from './components/ObjectClassSelector';
import DetectionConfig from './components/DetectionConfig';
import ResultsDisplay from './components/ResultsDisplay';
import {
  uploadAndDetect,
  getDetectionStatus,
  downloadExcel,
  downloadCSV,
  downloadVideo,
  getAvailableClasses,
} from './utils/api';
import './index.css';

const FALLBACK_CLASSES = [
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
];

function App() {
  const [step, setStep] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState(['person', 'car']);
  const [availableClasses, setAvailableClasses] = useState(FALLBACK_CLASSES);
  const [config, setConfig] = useState({
    model: 'yolov8n',
    confidence: 0.25,
    device: 'cpu',
    skipFrames: 0,
    maxFrames: 0,
    saveVideo: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [results, setResults] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Load real classes from backend on mount
  useEffect(() => {
    getAvailableClasses()
      .then((res) => {
      setAvailableClasses(res); // ✅ FIX
      })
      .catch(() => setAvailableClasses(FALLBACK_CLASSES));
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleVideoSelected = (file) => {
    setSelectedVideo(file);
    setResults(null);
    setError(null);
  };

  const handleVideoRemove = () => {
    setSelectedVideo(null);
    setStep(1);
  };

  const pollJobStatus = (jobId) => {
    let pollCount = 0;
    const MAX_POLLS = 400; // ~10 min at 1.5s intervals

    pollRef.current = setInterval(async () => {
      try {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          clearInterval(pollRef.current);
          setError('Processing timed out. Please try a shorter video.');
          setIsProcessing(false);
          return;
        }

        const status = await getDetectionStatus(jobId);

        // Log every response so you can see what the backend actually returns
        console.log('[Poll #' + pollCount + ']', status);

        setProcessingProgress(status.progress || 0);
        setProcessingMessage(status.message || '');

        if (status.status === 'completed') {
          clearInterval(pollRef.current);
          setResults(status.results);
          setIsProcessing(false);
          setStep(4);
        } else if (status.status === 'failed') {
          clearInterval(pollRef.current);
          setError(status.message || 'Processing failed on server');
          setIsProcessing(false);
        }
        // 'queued' or 'processing' → keep polling normally
      } catch (err) {
        console.error('[Poll] error:', err);
        clearInterval(pollRef.current);
        setError('Lost connection to server');
        setIsProcessing(false);
      }
    }, 2500);
  };

  const handleStartDetection = async () => {
    if (!selectedVideo || selectedClasses.length === 0) {
      alert('Please select a video and at least one object class');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage('Uploading video...');
    setError(null);

    try {
      const jobData = await uploadAndDetect(
        selectedVideo,
        selectedClasses,
        config,
        (uploadPercent) => {
          // Show upload progress up to 10%
          setProcessingProgress(uploadPercent); // ✅ FIXED
          setProcessingMessage(`Uploading: ${uploadPercent}%`);
        }
      );

      setCurrentJobId(jobData.job_id);
      setProcessingMessage('Processing started...');

      // Start polling for status
      pollJobStatus(jobData.job_id);

    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to start detection. Is the backend running?');
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!currentJobId) return;
    try {
      await downloadExcel(currentJobId);
    } catch (err) {
      alert('Failed to download Excel file');
    }
  };

  const handleDownloadCSV = async () => {
    if (!currentJobId) return;
    try {
      await downloadCSV(currentJobId);
    } catch (err) {
      alert('Failed to download CSV file');
    }
  };

  const handleDownloadVideo = async () => {
    if (!currentJobId) return;
    try {
      await downloadVideo(currentJobId);
    } catch (err) {
      alert('Failed to download video file');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep(1);
    setSelectedVideo(null);
    setResults(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingMessage('');
    setCurrentJobId(null);
    setError(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedVideo !== null;
      case 2: return selectedClasses.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <Video className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  YOLO Object Detection
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Video Analysis</p>
              </div>
            </div>
            {(results || error) && (
              <button onClick={handleReset} className="btn-secondary">
                New Detection
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {!results && !isProcessing && (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <StepIndicator
                      number={s}
                      active={step === s}
                      completed={step > s}
                      label={['Upload Video', 'Select Objects', 'Configure'][s - 1]}
                    />
                    {s < 3 && (
                      <div className={`h-0.5 w-12 ${step > s ? 'bg-primary-500' : 'bg-gray-300'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <VideoUpload
                    selectedVideo={selectedVideo}
                    onVideoSelected={handleVideoSelected}
                    onRemove={handleVideoRemove}
                  />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <ObjectClassSelector
                    availableClasses={availableClasses}
                    selectedClasses={selectedClasses}
                    onClassesChange={setSelectedClasses}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <DetectionConfig config={config} onChange={setConfig} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-between mt-8">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleStartDetection}
                  className="btn-primary flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  Start Detection
                </button>
              )}
            </div>
          </>
        )}

        {/* Processing State */}
        {isProcessing && (
          <ProcessingIndicator progress={processingProgress} message={processingMessage} />
        )}

        {/* Results */}
        {results && !isProcessing && (
          <ResultsDisplay
            results={results}
            onDownloadExcel={handleDownloadExcel}
            onDownloadCSV={handleDownloadCSV}
            onDownloadVideo={handleDownloadVideo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Built with YOLO v8 • Powered by AI</p>
        </div>
      </footer>
    </div>
  );
}

const StepIndicator = ({ number, active, completed, label }) => (
  <div className="flex flex-col items-center">
    <div
      className={`
        w-10 h-10 rounded-full flex items-center justify-center font-semibold
        transition-all duration-300
        ${completed
          ? 'bg-primary-500 text-white'
          : active
          ? 'bg-primary-500 text-white ring-4 ring-primary-200'
          : 'bg-gray-200 text-gray-500'
        }
      `}
    >
      {completed ? <Check size={20} /> : number}
    </div>
    <p className={`text-xs mt-2 font-medium ${active ? 'text-primary-600' : 'text-gray-500'}`}>
      {label}
    </p>
  </div>
);

const ProcessingIndicator = ({ progress, message }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="card p-12 text-center pulse-glow"
  >
    <div className="mb-6">
      <Loader className="w-16 h-16 mx-auto text-primary-600 spinner" />
    </div>
    <h2 className="text-2xl font-bold mb-2">Processing Video...</h2>
    <p className="text-gray-600 mb-6">{message || 'Detecting objects frame by frame'}</p>

    <div className="max-w-md mx-auto">
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-sm text-gray-600">{progress}% Complete</p>
    </div>

    <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
      <ProcessingStep label="Uploading video"    completed={progress > 10} />
      <ProcessingStep label="Running YOLO"       completed={progress > 60} />
      <ProcessingStep label="Exporting results"  completed={progress > 90} />
    </div>
  </motion.div>
);

const ProcessingStep = ({ label, completed }) => (
  <div className="text-center">
    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
    <p className="text-xs text-gray-600">{label}</p>
  </div>
);

export default App;
