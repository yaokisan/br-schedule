import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  colorScheme?: 'pink' | 'blue';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, colorScheme = 'pink' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-[6px]',
  };

  const borderColorClass = colorScheme === 'blue' ? 'border-theme-blue-500' : 'border-theme-pink-500';

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} ${borderColorClass} border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-3 text-slate-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;