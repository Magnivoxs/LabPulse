import type { AlertLevel } from '../types';

interface AlertBadgeProps {
  level: AlertLevel;
  size?: 'sm' | 'md' | 'lg';
}

export default function AlertBadge({ level, size = 'md' }: AlertBadgeProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const labels = {
    green: 'On Track',
    yellow: 'Attention',
    red: 'Critical',
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`${sizeClasses[size]} ${colorClasses[level]} rounded-full`}
        title={labels[level]}
      ></div>
      {size !== 'sm' && (
        <span className={`text-sm font-medium text-gray-700`}>{labels[level]}</span>
      )}
    </div>
  );
}
