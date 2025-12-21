import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { supabase, BusinessCategory } from '../../lib/supabase';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, ITALIAN_PROVINCES, CITIES_BY_PROVINCE } from '../../lib/cities';
import { SearchableSelect } from '../common/SearchableSelect';

export interface SearchFilters {
  category: string;
  region: string;
  province: string;
  city: string;
  businessName: string;
  minRating: number;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  navigateToSearchPage?: boolean;
  initialFilters?: SearchFilters;
}

export function AdvancedSearch({ onSearch, isLoading = false, navigateToSearchPage = false, initialFilters }: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>(ITALIAN_PROVINCES);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {
    category: '',
    region: '',
    province: '',
    city: '',
    businessName: '',
    minRating: 0,
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
      if (initialFilters.region) {
        setAvailableProvinces(PROVINCES_BY_REGION[initialFilters.region] || ITALIAN_PROVINCES);
      }
      if (initialFilters.province) {
        setAvailableCities(CITIES_BY_PROVINCE[initialFilters.province] || []);
      }
      if (initialFilters.category || initialFilters.region || initialFilters.province || initialFilters.city || initialFilters.minRating > 0) {
        setShowAdvanced(true);
      }
    }
  }, [initialFilters]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (filters.region) {
      const provinces = PROVINCES_BY_REGION[filters.region] || [];
      setAvailableProvinces(provinces);
      if (filters.province && !provinces.includes(filters.province)) {
        setFilters(prev => ({ ...prev, province: '', city: '' }));
        setAvailableCities([]);
      }
    } else {
      setAvailableProvinces(ITALIAN_PROVINCES);
    }
  }, [filters.region]);

  useEffect(() => {
    if (filters.province) {
      const cities = CITIES_BY_PROVINCE[filters.province] || [];
      setAvailableCities(cities);
      if (filters.city && !cities.includes(filters.city)) {
        setFilters(prev => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [filters.province]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearchClick = () => {
    if (navigateToSearchPage) {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.region) params.set('region', filters.region);
      if (filters.province) params.set('province', filters.province);
      if (filters.city) params.set('city', filters.city);
      if (filters.businessName) params.set('name', filters.businessName);
      if (filters.minRating > 0) params.set('rating', String(filters.minRating));

      const queryString = params.toString();
      const url = queryString ? `/search?${queryString}` : '/search';
      window.history.pushState({}, '', url);
    }
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      category: '',
      region: '',
      province: '',
      city: '',
      businessName: '',
      minRating: 0,
    });
    onSearch({
      category: '',
      region: '',
      province: '',
      city: '',
      businessName: '',
      minRating: 0,
    });
  };

  const hasActiveFilters = filters.category || filters.region || filters.province || filters.city || filters.businessName || filters.minRating > 0;

  return (
    <div className="space-y-3">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 border-r border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nome attività..."
              value={filters.businessName}
              onChange={(e) => setFilters({ ...filters, businessName: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
              className="flex-1 py-2 text-gray-900 bg-transparent outline-none placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2 transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Filtri avanzati"
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filtri</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {[filters.category, filters.region, filters.province, filters.city, filters.minRating > 0 ? 'rating' : ''].filter(Boolean).length}
              </span>
            )}
          </button>

          <button
            onClick={handleSearchClick}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
          >
            Cerca
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <SearchableSelect
                  value={filters.category}
                  onChange={(value) => setFilters({ ...filters, category: value })}
                  options={[
                    { value: '', label: 'Tutte le categorie' },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))
                  ]}
                  placeholder="Tutte le categorie"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regione
                </label>
                <SearchableSelect
                  value={filters.region}
                  onChange={(value) => {
                    const newProvinces = value ? PROVINCES_BY_REGION[value] || [] : ITALIAN_PROVINCES;
                    const shouldResetProvince = filters.province && value && !newProvinces.includes(filters.province);
                    setFilters({
                      ...filters,
                      region: value,
                      province: shouldResetProvince ? '' : filters.province,
                      city: shouldResetProvince ? '' : filters.city
                    });
                  }}
                  options={[
                    { value: '', label: 'Tutte le regioni' },
                    ...ITALIAN_REGIONS.map((region) => ({
                      value: region,
                      label: region,
                    }))
                  ]}
                  placeholder="Tutte le regioni"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <SearchableSelect
                  value={filters.province}
                  onChange={(value) => setFilters({ ...filters, province: value, city: value ? filters.city : '' })}
                  options={[
                    { value: '', label: 'Tutte le province' },
                    ...availableProvinces.map((province) => ({
                      value: province,
                      label: province,
                    }))
                  ]}
                  placeholder="Tutte le province"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Città
                </label>
                <SearchableSelect
                  value={filters.city}
                  onChange={(value) => setFilters({ ...filters, city: value })}
                  disabled={!filters.province}
                  options={[
                    { value: '', label: filters.province ? 'Tutte le città' : 'Seleziona prima provincia' },
                    ...availableCities.map((city) => ({
                      value: city,
                      label: city,
                    }))
                  ]}
                  placeholder={filters.province ? 'Tutte le città' : 'Seleziona prima provincia'}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valutazione Minima
                </label>
                <SearchableSelect
                  value={String(filters.minRating)}
                  onChange={(value) => setFilters({ ...filters, minRating: Number(value) })}
                  options={[
                    { value: '0', label: 'Tutte le valutazioni' },
                    { value: '1', label: '1 stella e più' },
                    { value: '2', label: '2 stelle e più' },
                    { value: '3', label: '3 stelle e più' },
                    { value: '4', label: '4 stelle e più' },
                    { value: '5', label: '5 stelle' },
                  ]}
                  placeholder="Tutte le valutazioni"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <button
                  onClick={handleReset}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Azzera
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
