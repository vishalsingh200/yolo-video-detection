import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Check, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoUpload from './components/VideoUpload';
import ObjectClassSelector from './components/ObjectClassSelector';
import DetectionConfig from './components/DetectionConfig';
import ResultsDisplay from './components/ResultsDisplay';
import { 
  uploadAndDetect, 
  getDetectionStatus, 
  downloadExcel, 
  downloadVideo,
  getAvailableClasses 
} from './utils/api';
import './index.css';

function App() {
  const [step, setStep] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState(['person', 'car']);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [config, setConfig] = useState({
    model: 'yolov8n',
    confidence: 0.25,
    device: 'cpu',
    skipFrames: 0,
    maxFrames: 0,
    saveVideo: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Load available classes on mount
  useEffect(() => {
    loadAvailableClasses();
  }, []);

  // Poll job status when processing
  useEffect(() => {
    if (isProcessing && jobId) {
      const interval = setInterval(async () => {
        try {
          const status = await getDetectionStatus(jobId);
          setProcessingProgress(status.progress);
          
          if (status.status === 'completed') {
            setResults(status.results);
            setIsProcessing(false);
            setStep(4);
            clearInterval(interval);
          } else if (status.status === 'failed') {
            setError(status.message || 'Processing failed');
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 1000); // Poll every second

      return () => clearInterval(interval);
    }
  }, [isProcessing, jobId]);

  const loadAvailableClasses = async () => {
    try {
      const classes = await getAvailableClasses();
      setAvailableClasses(classes);
    } catch (err) {
      console.error('Error loading classes:', err);
      // Fallback to default classes
      setAvailableClasses([
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
        'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
        'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'cell phone'
      ]);
    }
  };

  const handleVideoSelected = (file) => {
    setSelectedVideo(file);
    setResults(null);
    setError(null);
  };

  const handleVideoRemove = () => {
    setSelectedVideo(null);
    setStep(1);
  };

  const handleStartDetection = async () => {
    if (!selectedVideo || selectedClasses.length === 0) {
      setError('Please select a video and at least one object class');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setUploadProgress(0);
      setProcessingProgress(0);

      // Upload video and start detection
      const response = await uploadAndDetect(
        selectedVideo,
        selectedClasses,
        config,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Store job ID
      setJobId(response.job_id);

      // Status polling will continue in useEffect
      
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.message || 'Failed to start detection');
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadExcel(jobId);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download Excel file');
    }
  };

  const handleDownloadVideo = async () => {
    try {
      await downloadVideo(jobId);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download video file');
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedVideo(null);
    setResults(null);
    setIsProcessing(false);
    setUploadProgress(0);
    setProcessingProgress(0);
    setJobId(null);
    setError(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedVideo !== null;
      case 2:
        return selectedClasses.length > 0;
      case 3:
        return true;
      default:
        return false;
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
            {results && (
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                New Detection
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </motion.div>
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
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <VideoUpload
                    selectedVideo={selectedVideo}
                    onVideoSelected={handleVideoSelected}
                    onRemove={handleVideoRemove}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ObjectClassSelector
                    availableClasses={availableClasses}
                    selectedClasses={selectedClasses}
                    onClassesChange={setSelectedClasses}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
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
                  disabled={!canProceed()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <ProcessingIndicator 
            uploadProgress={uploadProgress}
            processingProgress={processingProgress}
          />
        )}

        {/* Results */}
        {results && !isProcessing && (
          <ResultsDisplay
            results={results}
            onDownloadExcel={handleDownloadExcel}
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

const ProcessingIndicator = ({ uploadProgress, processingProgress }) => {
  const totalProgress = uploadProgress < 100 ? uploadProgress : processingProgress;
  const stage = uploadProgress < 100 ? 'Uploading video...' : 'Processing video...';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-12 text-center pulse-glow"
    >
      <div className="mb-6">
        <Loader className="w-16 h-16 mx-auto text-primary-600 spinner" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{stage}</h2>
      <p className="text-gray-600 mb-6">
        {uploadProgress < 100 
          ? 'Please wait while we upload your video...'
          : 'Detecting objects frame by frame...'
        }
      </p>
      
      <div className="max-w-md mx-auto">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-sm text-gray-600">{totalProgress}% Complete</p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
        <ProcessingStep label="Uploading" completed={uploadProgress >= 100} />
        <ProcessingStep label="Detecting" completed={processingProgress > 50} />
        <ProcessingStep label="Exporting" completed={processingProgress >= 90} />
      </div>
    </motion.div>
  );
};

const ProcessingStep = ({ label, completed }) => (
  <div className="text-center">
    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
    <p className="text-xs text-gray-600">{label}</p>
  </div>
);

export default App;
