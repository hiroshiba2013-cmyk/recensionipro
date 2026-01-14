import { CheckCircle2, Award, Shield } from 'lucide-react';

interface VerificationBadgeProps {
  badge: 'claimed' | 'verified' | 'premium' | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VerificationBadge({ badge, size = 'md', showText = true }: VerificationBadgeProps) {
  if (!badge) return null;

  const configs = {
    claimed: {
      icon: CheckCircle2,
      label: 'Rivendicata',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
    },
    verified: {
      icon: Shield,
      label: 'Verificata',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
    },
    premium: {
      icon: Award,
      label: 'Premium',
      bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      iconColor: 'text-amber-600',
    },
  };

  const config = configs[badge];
  if (!config) return null;

  const Icon = config.icon;

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
        className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border-2 p-1`}
        title={config.label}
      >
        <Icon className={`${currentSize.icon} ${config.iconColor}`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${currentSize.container} rounded-full ${config.bgColor} ${config.textColor} ${config.borderColor} border font-semibold`}
    >
      <Icon className={`${currentSize.icon} ${config.iconColor}`} />
      <span>{config.label}</span>
    </div>
  );
}
