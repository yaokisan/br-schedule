import React from 'react';
import { MaybeReason, ALL_MAYBE_REASONS } from '../types';

interface CheckboxGroupProps {
  selectedReasons: MaybeReason[];
  onChange: (reason: MaybeReason, checked: boolean) => void;
  title?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ selectedReasons, onChange, title }) => {
  return (
    <div className="mt-2 space-y-2">
      {title && <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>}
      {ALL_MAYBE_REASONS.map((reason) => (
        <label key={reason} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 text-theme-pink-500 border-slate-300 rounded focus:ring-theme-pink-400"
            checked={selectedReasons.includes(reason)}
            onChange={(e) => onChange(reason, e.target.checked)}
          />
          <span className="text-sm text-slate-700">{reason}</span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxGroup;