import React from 'react';
import { Download, BarChart3, FileText, Video as VideoIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const ResultsDisplay = ({ results, onDownloadExcel, onDownloadVideo }) => {
  if (!results) return null;

  const { statistics, video_properties, frame_results, target_classes } = results;

  // Prepare chart data
  const frameChartData = frame_results.slice(0, 100).map(frame => ({
    frame: frame.frame_number,
    total: Object.values(frame.counts).reduce((a, b) => a + b, 0),
    ...frame.counts
  }));

  const classChartData = target_classes.map(cls => ({
    name: cls,
    total: statistics.class_totals[cls],
    average: parseFloat(statistics.class_averages[cls].toFixed(2)),
    max: statistics.class_max[cls]
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Download Buttons */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-1">
              Detection Complete! 🎉
            </h2>
            <p className="text-gray-600">
              Processed {results.frames_processed} frames
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onDownloadExcel}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Download Excel
            </button>
            {results.output_video && (
              <button
                onClick={onDownloadVideo}
                className="btn-secondary flex items-center gap-2"
              >
                <VideoIcon size={18} />
                Download Video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="text-blue-600" size={24} />}
          label="Total Detections"
          value={statistics.total_detections.toLocaleString()}
          color="bg-blue-50"
        />
        <StatCard
          icon={<FileText className="text-green-600" size={24} />}
          label="Frames Processed"
          value={results.frames_processed.toLocaleString()}
          color="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="text-purple-600" size={24} />}
          label="Detection Rate"
          value={`${((statistics.frames_with_detections / results.frames_processed) * 100).toFixed(1)}%`}
          color="bg-purple-50"
        />
        <StatCard
          icon={<VideoIcon className="text-orange-600" size={24} />}
          label="Video Duration"
          value={`${video_properties.duration.toFixed(1)}s`}
          color="bg-orange-50"
        />
      </div>

      {/* Per-Class Statistics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary-600" />
          Per-Class Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Object</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Count</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg per Frame</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Max in Frame</th>
              </tr>
            </thead>
            <tbody>
              {target_classes.map((cls, idx) => (
                <tr key={cls} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-medium capitalize">{cls}</span>
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-gray-900">
                    {statistics.class_totals[cls].toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">
                    {statistics.class_averages[cls].toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">
                    {statistics.class_max[cls]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Detection Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={frameChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frame" label={{ value: 'Frame Number', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Object Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {target_classes.map((cls, idx) => (
                <Line
                  key={cls}
                  type="monotone"
                  dataKey={cls}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Showing first 100 frames
          </p>
        </div>

        {/* Bar Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Total Detections by Class</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#667eea" name="Total Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Video Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Video Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="Resolution" value={`${video_properties.width}x${video_properties.height}`} />
          <InfoItem label="FPS" value={video_properties.fps.toFixed(2)} />
          <InfoItem label="Total Frames" value={video_properties.total_frames.toLocaleString()} />
          <InfoItem label="Duration" value={`${video_properties.duration.toFixed(2)}s`} />
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`card p-6 ${color} border border-transparent`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-white rounded-lg">
        {icon}
      </div>
    </div>
  </motion.div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
);

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

export default ResultsDisplay;
