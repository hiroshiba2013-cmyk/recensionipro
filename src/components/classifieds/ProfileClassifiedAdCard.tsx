import { MapPin, Eye, Calendar, Edit2, Trash2, Clock } from 'lucide-react';
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

  const getDaysRemaining = () => {
    if (!ad.expires_at) {
      const createdAt = new Date(ad.created_at);
      const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    const expiresAt = new Date(ad.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationDate = () => {
    if (!ad.expires_at) {
      const createdAt = new Date(ad.created_at);
      const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiresAt;
    }
    return new Date(ad.expires_at);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null;
  const daysRemaining = getDaysRemaining();
  const expirationDate = getExpirationDate();

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      onDelete(ad.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Image */}
      <div className="relative aspect-video bg-gray-200">
        {firstImage ? (
          <img
            src={firstImage}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">{ad.classified_categories.icon}</span>
          </div>
        )}

        {/* Ad Type Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
          ad.ad_type === 'sell'
            ? 'bg-blue-600 text-white'
            : ad.ad_type === 'buy'
            ? 'bg-green-600 text-white'
            : 'bg-orange-600 text-white'
        }`}>
          {ad.ad_type === 'sell' ? '💰 Vendo' : ad.ad_type === 'buy' ? '🔍 Cerco' : '🎁 Regalo'}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-900 shadow-sm">
          {ad.classified_categories.name}
        </div>

        {/* Price Badge */}
        {ad.price && (
          <div className="absolute top-3 right-3 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            €{ad.price.toLocaleString('it-IT')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {truncateText(ad.title, 50)}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {truncateText(ad.description, 100)}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>
            {ad.city}, {ad.province}
          </span>
        </div>

        {/* Stats */}
        <div className="pt-3 border-t border-gray-100 mb-3">
          <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{ad.views_count} visualizzazioni</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(ad.created_at)}</span>
            </div>
          </div>
          <div className={`text-sm font-semibold flex items-center gap-1 ${
            daysRemaining <= 3
              ? 'text-red-600'
              : daysRemaining <= 7
              ? 'text-orange-600'
              : 'text-green-600'
          }`}>
            <Clock className="w-4 h-4" />
            <span>Scade il {expirationDate.toLocaleDateString('it-IT')} ({daysRemaining} {daysRemaining === 1 ? 'giorno' : 'giorni'} rimanenti)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`/classified/${ad.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-semibold"
          >
            Visualizza
          </a>
          <button
            onClick={() => onEdit(ad)}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
          >
            <Edit2 className="w-4 h-4" />
            Modifica
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
              showDeleteConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {showDeleteConfirm ? 'Conferma' : 'Elimina'}
          </button>
          {showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Annulla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
