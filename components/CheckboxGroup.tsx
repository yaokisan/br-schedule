import React from 'react';
import { MaybeReason, ALL_MAYBE_REASONS } from '../types';

interface CheckboxGroupProps {
  selectedReasons: MaybeReason[];
  onChange: (reason: MaybeReason, checked: boolean) => void;
  title?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  selectedReasons,
  onChange,
  title,
}) => {
  return (
    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
      {title && <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>}
      <div className="space-y-1">
        {ALL_MAYBE_REASONS.map((reason) => (
          <div key={reason}>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 text-theme-pink-500 border-slate-300 rounded focus:ring-theme-pink-400"
                checked={selectedReasons.includes(reason)}
                onChange={(e) => onChange(reason, e.target.checked)}
              />
              <span className="text-sm text-slate-700">{reason}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;