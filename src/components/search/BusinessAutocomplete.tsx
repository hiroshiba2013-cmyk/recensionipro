import { useState, useEffect, useRef } from 'react';
import { Search, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Business {
  id: string;
  name: string;
  city?: string;
  category?: {
    name: string;
  };
}

interface BusinessAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (businessId: string) => void;
  placeholder?: string;
}

export default function BusinessAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Cerca attività...',
}: BusinessAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchBusinesses(value);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  async function searchBusinesses(query: string) {
    try {
      setLoading(true);

      const { data: claimedData } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          category:business_categories(name),
          business_locations(city)
        `)
        .ilike('name', `%${query}%`)
        .limit(5);

      const { data: unclaimedData } = await supabase
        .from('unclaimed_business_locations')
        .select(`
          id,
          name,
          city,
          category:business_categories(name)
        `)
        .ilike('name', `%${query}%`)
        .limit(5);

      const claimed = (claimedData || []).map(b => ({
        id: b.id,
        name: b.name,
        city: b.business_locations?.[0]?.city,
        category: b.category,
      }));

      const unclaimed = (unclaimedData || []).map(b => ({
        id: b.id,
        name: b.name,
        city: b.city,
        category: b.category,
      }));

      const combined = [...claimed, ...unclaimed];
      setSuggestions(combined);
      setShowSuggestions(combined.length > 0);
    } catch (error) {
      console.error('Error searching businesses:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(business: Business) {
    onChange(business.name);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(business.id);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {suggestions.map((business) => (
            <button
              key={business.id}
              onClick={() => handleSelect(business)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{business.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {business.category && (
                      <span className="text-xs text-gray-500">{business.category.name}</span>
                    )}
                    {business.city && (
                      <>
                        {business.category && <span className="text-gray-300">•</span>}
                        <span className="text-xs text-gray-500">{business.city}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
