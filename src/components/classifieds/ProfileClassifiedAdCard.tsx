import { MapPin, Eye, Calendar, FileEdit as Edit2, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

interface ClassifiedAd {
  id: string;
  ad_type: 'sell' | 'buy' | 'gift';
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  images: string[] | null;
  views_count: number;
  created_at: string;
  expires_at: string | null;
  status: string;
  approval_status?: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  classified_categories: {
    name: string;
    icon: string;
  };
}

interface ProfileClassifiedAdCardProps {
  ad: ClassifiedAd;
  onEdit: (ad: ClassifiedAd) => void;
  onDelete: (adId: string) => void;
}

export function ProfileClassifiedAdCard({ ad, onEdit, onDelete }: ProfileClassifiedAdCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  if (!ad) return null;

  const getDaysRemaining = () => {
    const base = ad.expires_at
      ? new Date(ad.expires_at)
      : new Date(new Date(ad.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
    return Math.ceil((base.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('it-IT');

  const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null;
  const daysRemaining = getDaysRemaining();

  const adTypeConfig = {
    sell: { label: 'Vendo', cls: 'bg-blue-600 text-white' },
    buy:  { label: 'Cerco', cls: 'bg-green-600 text-white' },
    gift: { label: 'Regalo', cls: 'bg-orange-500 text-white' },
  };
  const adType = adTypeConfig[ad.ad_type] ?? adTypeConfig.sell;

  return (
    <div className={`bg-white rounded-lg border overflow-hidden flex ${
      ad.approval_status === 'pending' ? 'border-amber-400 ring-1 ring-amber-200' :
      ad.approval_status === 'rejected' ? 'border-red-400 ring-1 ring-red-200' :
      'border-gray-200'
    }`}>
      {/* Image — compact square */}
      <div className="relative w-24 flex-shrink-0 bg-gray-100">
        {firstImage ? (
          <img src={firstImage} alt={ad.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {ad.classified_categories?.icon || '📦'}
          </div>
        )}
        <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${adType.cls}`}>
          {adType.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-3 min-w-0">
        {/* Status banner */}
        {ad.approval_status === 'pending' && (
          <div className="flex items-center gap-1 mb-1.5">
            <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-amber-700">In attesa di approvazione</span>
          </div>
        )}
        {ad.approval_status === 'rejected' && (
          <span className="text-[10px] font-semibold text-red-700 mb-1.5">Annuncio rifiutato</span>
        )}

        {/* Title + price */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
            {ad.title}
          </h3>
          {ad.price && (
            <span className="text-sm font-bold text-gray-900 flex-shrink-0">
              €{ad.price.toLocaleString('it-IT')}
            </span>
          )}
        </div>

        {/* Category + location row */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
            {ad.classified_categories?.name || 'Annuncio'}
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {ad.city}, {ad.province}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {ad.views_count}
          </span>
          <span className="flex items-center gap-0.5">
            <Calendar className="w-3 h-3" />
            {formatDate(ad.created_at)}
          </span>
          <span className={`flex items-center gap-0.5 font-semibold ${
            daysRemaining <= 3 ? 'text-red-600' :
            daysRemaining <= 7 ? 'text-orange-500' :
            'text-green-600'
          }`}>
            <Clock className="w-3 h-3" />
            {daysRemaining}gg
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-auto">
          <a
            href={`/classified/${ad.id}`}
            className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded text-center text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Visualizza
          </a>
          <button
            onClick={() => onEdit(ad)}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1.5 rounded text-xs font-semibold hover:bg-gray-200 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Modifica
          </button>
          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
              showDeleteConfirm ? 'bg-red-600 text-white' : 'bg-gray-100 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            {showDeleteConfirm ? 'Conferma' : 'Elimina'}
          </button>
          {showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
            >
              Annulla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
