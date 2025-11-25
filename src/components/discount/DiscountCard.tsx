import { Tag, Calendar } from 'lucide-react';
import { Discount } from '../../lib/supabase';

interface DiscountCardProps {
  discount: Discount;
}

export function DiscountCard({ discount }: DiscountCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">{discount.title}</h4>
        </div>
        <div className="bg-green-600 text-white px-4 py-2 rounded-full text-xl font-bold">
          -{discount.discount_percentage}%
        </div>
      </div>

      <p className="text-gray-700 mb-4">{discount.description}</p>

      <div className="flex items-center justify-between">
        <div className="bg-white px-4 py-2 rounded-lg border-2 border-dashed border-green-300">
          <p className="text-xs text-gray-500 mb-1">Codice sconto</p>
          <p className="font-mono font-bold text-green-700">{discount.code}</p>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Valido fino al {formatDate(discount.valid_until)}</span>
        </div>
      </div>
    </div>
  );
}
