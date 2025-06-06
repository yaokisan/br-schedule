
import React from 'react';
import { AvailabilityStatus, ALL_AVAILABILITY_STATUSES } from '../types';

interface AvailabilitySelectorProps {
  selectedStatus: AvailabilityStatus | null;
  onChange: (status: AvailabilityStatus) => void;
}

const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({ selectedStatus, onChange }) => {
  const getButtonClass = (status: AvailabilityStatus) => {
    let baseClass = 'px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out border-2 ';
    if (selectedStatus === status) {
      switch (status) {
        case AvailabilityStatus.AVAILABLE:
          return baseClass + 'bg-green-500 text-white border-green-600 shadow-md';
        case AvailabilityStatus.MAYBE:
          return baseClass + 'bg-yellow-400 text-slate-800 border-yellow-500 shadow-md';
        case AvailabilityStatus.UNAVAILABLE:
          return baseClass + 'bg-red-500 text-white border-red-600 shadow-md';
        default:
          return baseClass + 'bg-slate-200 text-slate-700 border-slate-300';
      }
    }
    // Not selected
    switch (status) {
        case AvailabilityStatus.AVAILABLE:
          return baseClass + 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
        case AvailabilityStatus.MAYBE:
          return baseClass + 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
        case AvailabilityStatus.UNAVAILABLE:
          return baseClass + 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
        default:
          return baseClass + 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200';
      }
  };
  
  return (
    <div className="flex space-x-2">
      {ALL_AVAILABILITY_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={getButtonClass(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
};

export default AvailabilitySelector;
    