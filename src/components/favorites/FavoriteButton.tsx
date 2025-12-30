import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FavoriteButtonProps {
  type: 'business' | 'ad' | 'job';
  itemId: string;
  familyMemberId?: string | null;
  showLabel?: boolean;
  className?: string;
}

export function FavoriteButton({
  type,
  itemId,
  familyMemberId = null,
  showLabel = false,
  className = ''
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const tableName = type === 'business'
    ? 'favorite_businesses'
    : type === 'ad'
    ? 'favorite_classified_ads'
    : 'favorite_job_postings';

  const columnName = type === 'business'
    ? 'business_id'
    : type === 'ad'
    ? 'ad_id'
    : 'job_id';

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, itemId, familyMemberId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from(tableName)
        .select('id')
        .eq('user_id', user.id)
        .eq(columnName, itemId);

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
      } else {
        query = query.is('family_member_id', null);
      }

      const { data } = await query.maybeSingle();
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Devi effettuare il login per aggiungere ai preferiti');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        let query = supabase
          .from(tableName)
          .delete()
          .eq('user_id', user.id)
          .eq(columnName, itemId);

        if (familyMemberId) {
          query = query.eq('family_member_id', familyMemberId);
        } else {
          query = query.is('family_member_id', null);
        }

        await query;
        setIsFavorite(false);
      } else {
        const insertData: any = {
          user_id: user.id,
          [columnName]: itemId,
          family_member_id: familyMemberId
        };

        await supabase
          .from(tableName)
          .insert(insertData);

        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      alert('Errore durante l\'operazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isFavorite
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
    >
      <Heart
        className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Preferito' : 'Aggiungi ai preferiti'}
        </span>
      )}
    </button>
  );
}
