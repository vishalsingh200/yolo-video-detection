import React from 'react';
import { Settings, Zap, Target, Cpu } from 'lucide-react';

const YOLO_MODELS = [
  { id: 'yolov8n', name: 'Nano', speed: 'Fastest', accuracy: 'Good', size: '6 MB', icon: '⚡' },
  { id: 'yolov8s', name: 'Small', speed: 'Fast', accuracy: 'Better', size: '22 MB', icon: '🚀' },
  { id: 'yolov8m', name: 'Medium', speed: 'Medium', accuracy: 'Great', size: '52 MB', icon: '⭐' },
  { id: 'yolov8l', name: 'Large', speed: 'Slower', accuracy: 'Excellent', size: '87 MB', icon: '💎' },
  { id: 'yolov8x', name: 'Extra Large', speed: 'Slowest', accuracy: 'Best', size: '136 MB', icon: '👑' },
];

const DetectionConfig = ({ config, onChange }) => {
  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-primary-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">Detection Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-primary-600" />
              <span>YOLO Model</span>
            </div>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {YOLO_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleChange('model', model.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all duration-200
                  ${config.model === model.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{model.name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {model.speed}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          {model.accuracy}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {model.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  {config.model === model.id && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-primary-600" />
              <span>Confidence Threshold</span>
              <span className="ml-auto text-primary-600 font-semibold">
                {(config.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={config.confidence * 100}
            onChange={(e) => handleChange('confidence', e.target.value / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low (10%)</span>
            <span>High (100%)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Higher values = fewer detections but more accurate
          </p>
        </div>

        {/* Device Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-primary-600" />
              <span>Processing Device</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleChange('device', 'cpu')}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${config.device === 'cpu'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
                }
              `}
            >
              <div className="font-semibold text-gray-900">CPU</div>
              <div className="text-xs text-gray-500 mt-1">Universal</div>
            </button>
            <button
              onClick={() => handleChange('device', 'cuda')}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${config.device === 'cuda'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
                }
              `}
            >
              <div className="font-semibold text-gray-900">GPU (CUDA)</div>
              <div className="text-xs text-gray-500 mt-1">Faster</div>
            </button>
          </div>
        </div>

        {/* Advanced Options */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
            Advanced Options
          </summary>
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
            {/* Skip Frames */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skip Frames (for faster processing)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={config.skipFrames}
                onChange={(e) => handleChange('skipFrames', parseInt(e.target.value))}
                className="input-field"
                placeholder="0 = process all frames"
              />
              <p className="text-xs text-gray-500 mt-1">
                Process every Nth frame (0 = all frames)
              </p>
            </div>

            {/* Max Frames */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Frames to Process
              </label>
              <input
                type="number"
                min="0"
                value={config.maxFrames}
                onChange={(e) => handleChange('maxFrames', parseInt(e.target.value))}
                className="input-field"
                placeholder="0 = all frames"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit total frames (0 = no limit)
              </p>
            </div>

            {/* Save Annotated Video */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.saveVideo}
                  onChange={(e) => handleChange('saveVideo', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Save Annotated Video
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Creates video with bounding boxes (slower)
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DetectionConfig;
