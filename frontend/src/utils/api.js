import axios from 'axios';
import { saveAs } from 'file-saver';

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";
// const API_BASE_URL = "http://127.0.0.1:8000/api";



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload video and start detection
export const uploadAndDetect = async (video, classes, config, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('video', video);
    formData.append('classes', JSON.stringify(classes));
    formData.append('model', config.model);
    formData.append('confidence', config.confidence);
    formData.append('device', config.device);
    formData.append('skipFrames', config.skipFrames);
    formData.append('maxFrames', config.maxFrames);
    formData.append('saveVideo', config.saveVideo);

    const response = await api.post('/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onUploadProgress) {
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error.response?.data || error.message;
  }
};

// Get available object classes
export const getAvailableClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response.data.classes;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error.response?.data || error.message;
  }
};

// Get available YOLO models
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/models');
    return response.data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error.response?.data || error.message;
  }
};

// Get detection status
export const getDetectionStatus = async (jobId) => {
  try {
    const response = await api.get(`/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching status:', error);
    throw error.response?.data || error.message;
  }
};

// Download Excel results
export const downloadExcel = async (jobId) => {
  try {
    const response = await api.get(`/download/${jobId}/excel`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    saveAs(blob, 'detection_results.xlsx');
    return true;
  } catch (error) {
    console.error('Error downloading Excel:', error);
    throw error.response?.data || error.message;
  }
};

// Download CSV results
export const downloadCSV = async (jobId) => {
  try {
    const response = await api.get(`/download/${jobId}/csv`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    saveAs(blob, 'detection_results.csv');
    return true;
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error.response?.data || error.message;
  }
};

// Download annotated video
export const downloadVideo = async (jobId) => {
  try {
    const response = await api.get(`/download/${jobId}/video`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'video/mp4' });
    saveAs(blob, 'detected_video.mp4');
    return true;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error.response?.data || error.message;
  }
};

// List all jobs
export const listJobs = async () => {
  try {
    const response = await api.get('/jobs');
    return response.data.jobs;
  } catch (error) {
    console.error('Error listing jobs:', error);
    throw error.response?.data || error.message;
  }
};

// Delete job
export const deleteJob = async (jobId) => {
  try {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error.response?.data || error.message;
  }
};

export default api;
