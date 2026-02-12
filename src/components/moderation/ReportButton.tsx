import { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';

interface ReportButtonProps {
  entityType: 'review' | 'business' | 'classified_ad' | 'job_posting' | 'product';
  entityId: string;
  compact?: boolean;
}

export default function ReportButton({ entityType, entityId, compact = false }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const getButtonText = () => {
    switch (entityType) {
      case 'review':
        return 'Segnala recensione';
      case 'classified_ad':
        return 'Segnala annuncio';
      case 'business':
        return 'Segnala attività';
      case 'job_posting':
        return 'Segnala offerta';
      case 'product':
        return 'Segnala prodotto';
      default:
        return 'Segnala';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 ${
          compact
            ? 'text-xs text-gray-500 hover:text-red-600'
            : 'text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
        } transition-all duration-200`}
        title="Segnala contenuto inappropriato"
      >
        <Flag className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        {!compact && <span>{getButtonText()}</span>}
      </button>

      {showModal && (
        <ReportModal
          entityType={entityType}
          entityId={entityId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
