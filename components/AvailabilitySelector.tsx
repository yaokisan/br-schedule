import React from 'react';
import { AvailabilityStatus, ALL_AVAILABILITY_STATUSES } from '../types';

interface AvailabilitySelectorProps {
  selectedStatus: AvailabilityStatus | null;
  onChange: (status: AvailabilityStatus) => void;
}

const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({ selectedStatus, onChange }) => {
  const getStatusInfo = (status: AvailabilityStatus) => {
    switch (status) {
        case AvailabilityStatus.AVAILABLE:
        return {
          selected: 'bg-green-500 text-white shadow-lg ring-2 ring-offset-2 ring-green-500',
          unselected: 'bg-white text-green-500 border-2 border-green-400 hover:bg-green-50'
        };
        case AvailabilityStatus.MAYBE:
        return {
          selected: 'bg-yellow-500 text-white shadow-lg ring-2 ring-offset-2 ring-yellow-500',
          unselected: 'bg-white text-yellow-500 border-2 border-yellow-400 hover:bg-yellow-50'
        };
        case AvailabilityStatus.UNAVAILABLE:
        return {
          selected: 'bg-red-500 text-white shadow-lg ring-2 ring-offset-2 ring-red-500',
          unselected: 'bg-white text-red-500 border-2 border-red-400 hover:bg-red-50'
        };
        default:
        return { selected: '', unselected: 'bg-slate-100 text-slate-600 border-slate-300' };
      }
  };

  const baseClass = 'rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-all duration-200 focus:outline-none';
  
  return (
    <div className="flex space-x-3">
      {ALL_AVAILABILITY_STATUSES.map((status) => {
        const { selected, unselected } = getStatusInfo(status);
        const isSelected = selectedStatus === status;
        return (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
            className={`${baseClass} ${isSelected ? selected : unselected}`}
            aria-pressed={isSelected}
        >
          {status}
        </button>
        );
      })}
    </div>
  );
};

export default AvailabilitySelector;
    