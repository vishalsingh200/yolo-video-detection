import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoUpload = ({ onVideoSelected, selectedVideo, onRemove }) => {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      onVideoSelected(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [onVideoSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    multiple: false,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleRemove = () => {
    setPreview(null);
    onRemove();
  };

  if (selectedVideo) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Video Selected</h3>
              <p className="text-sm text-gray-500">{selectedVideo.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {preview && (
          <div className="mt-4 rounded-lg overflow-hidden bg-black">
            <video
              src={preview}
              controls
              className="w-full max-h-64 object-contain"
            />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        {...getRootProps()}
        className={`
          card p-12 cursor-pointer transition-all duration-300
          border-2 border-dashed
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isDragActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`
              p-6 rounded-full mb-4 transition-colors
              ${isDragActive ? 'bg-primary-100' : 'bg-gray-100'}
            `}
          >
            {isDragActive ? (
              <Upload className="text-primary-600" size={48} />
            ) : (
              <Video className="text-gray-400" size={48} />
            )}
          </motion.div>

          {isDragActive ? (
            <p className="text-lg font-semibold text-primary-600">
              Drop your video here
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Upload Video File
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag & drop or click to browse
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                <span className="badge badge-primary">MP4</span>
                <span className="badge badge-primary">AVI</span>
                <span className="badge badge-primary">MOV</span>
                <span className="badge badge-primary">MKV</span>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Maximum file size: 500MB
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoUpload;
