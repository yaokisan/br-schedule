import React from 'react';
import { MaybeReason, ALL_MAYBE_REASONS } from '../types';

interface CheckboxGroupProps {
  selectedReasons: MaybeReason[];
  onChange: (reason: MaybeReason, checked: boolean) => void;
  title?: string;
  otherReasonComment?: string;
  onOtherReasonCommentChange?: (comment: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  selectedReasons,
  onChange,
  title,
  otherReasonComment,
  onOtherReasonCommentChange,
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
            {reason === MaybeReason.OTHER && selectedReasons.includes(MaybeReason.OTHER) && (
              <div className="mt-2 ml-8">
                <textarea
                  value={otherReasonComment || ''}
                  onChange={(e) => onOtherReasonCommentChange?.(e.target.value)}
                  className="w-full p-2 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-theme-pink-300 focus:border-theme-pink-300"
                  placeholder="具体的な理由を入力してください"
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;