import { CheckCircle2, UserPlus } from 'lucide-react';

interface VerificationBadgeProps {
  isClaimed: boolean;
  isUserAdded?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function VerificationBadge({ isClaimed, isUserAdded = false, size = 'md', showText = true }: VerificationBadgeProps) {
  if (!isClaimed && !isUserAdded) return null;

  const Icon = isClaimed ? CheckCircle2 : UserPlus;
  const text = isClaimed ? 'Rivendicata' : 'Attività aggiunta da utente';
  const bgColor = isClaimed
    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700'
    : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300 text-blue-700';
  const iconColor = isClaimed ? 'text-green-600 fill-green-100' : 'text-blue-600 fill-blue-100';

  const sizeClasses = {
    sm: {
      container: 'px-2.5 py-1 text-xs',
      icon: 'w-3.5 h-3.5',
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
        className={`inline-flex items-center justify-center rounded-full ${bgColor} border-2 p-1 shadow-sm`}
        title={text}
      >
        <Icon className={`${currentSize.icon} ${iconColor}`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${currentSize.container} rounded-full ${bgColor} border-2 font-bold shadow-sm`}
    >
      <Icon className={`${currentSize.icon} ${iconColor}`} />
      <span>{text}</span>
    </div>
  );
}
