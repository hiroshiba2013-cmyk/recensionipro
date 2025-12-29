import { MapPin, Eye, Calendar } from 'lucide-react';

interface ClassifiedAd {
  id: string;
  ad_type: 'sell' | 'buy';
  title: string;
  description: string;
  price: number | null;
  location: string;
  city: string;
  province: string;
  images: string[] | null;
  views_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  classified_categories: {
    name: string;
    icon: string;
  };
}

interface ClassifiedAdCardProps {
  ad: ClassifiedAd;
}

export function ClassifiedAdCard({ ad }: ClassifiedAdCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return date.toLocaleDateString('it-IT');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null;

  return (
    <a
      href={`/classified/${ad.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-200">
        {firstImage ? (
          <img
            src={firstImage}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            : 'bg-green-600 text-white'
        }`}>
          {ad.ad_type === 'sell' ? '💰 Vendo' : '🔍 Cerco'}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {ad.profiles.avatar_url ? (
              <img
                src={ad.profiles.avatar_url}
                alt={ad.profiles.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {ad.profiles.full_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium">
              {ad.profiles.full_name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{ad.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(ad.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
