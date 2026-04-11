import React, { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_CLASSES = [
  'person', 'car', 'bicycle', 'motorcycle', 'bus', 'truck',
  'dog', 'cat', 'bird', 'cell phone', 'laptop', 'bottle'
];

const ObjectClassSelector = ({ availableClasses, selectedClasses, onClassesChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredClasses = availableClasses.filter(cls =>
    cls.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayClasses = showAll ? filteredClasses : 
    filteredClasses.filter(cls => POPULAR_CLASSES.includes(cls));

  const toggleClass = (className) => {
    if (selectedClasses.includes(className)) {
      onClassesChange(selectedClasses.filter(c => c !== className));
    } else {
      onClassesChange([...selectedClasses, className]);
    }
  };

  const selectAll = () => {
    onClassesChange(displayClasses);
  };

  const clearAll = () => {
    onClassesChange([]);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Objects to Detect
        </h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search objects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Toggle Popular/All */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowAll(false)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            !showAll
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Popular ({POPULAR_CLASSES.length})
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            showAll
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Classes ({availableClasses.length})
        </button>
      </div>

      {/* Selected Count */}
      <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-sm font-medium text-primary-900">
          {selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'} selected
        </p>
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2">
        <AnimatePresence>
          {displayClasses.map((className) => {
            const isSelected = selectedClasses.includes(className);
            return (
              <motion.button
                key={className}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => toggleClass(className)}
                className={`
                  relative px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 text-left
                  ${isSelected
                    ? 'bg-primary-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="capitalize truncate">{className}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-shrink-0"
                    >
                      <Check size={16} />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {displayClasses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No classes found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default ObjectClassSelector;
