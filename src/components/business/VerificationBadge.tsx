import { CheckCircle2 } from 'lucide-react';

interface VerificationBadgeProps {
  isClaimed: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VerificationBadge({ isClaimed, size = 'md', showText = true }: VerificationBadgeProps) {
  if (!isClaimed) return null;

  const Icon = CheckCircle2;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      gap: 'gap-1',
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      gap: 'gap-2',
    },
  };

  const currentSize = sizeClasses[size];

  if (!showText) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-full bg-blue-50 border-blue-200 border-2 p-1"
        title="Rivendicata"
      >
        <Icon className={`${currentSize.icon} text-blue-600`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${currentSize.container} rounded-full bg-blue-50 text-blue-700 border-blue-200 border font-semibold`}
    >
      <Icon className={`${currentSize.icon} text-blue-600`} />
      <span>Rivendicata</span>
    </div>
  );
}
