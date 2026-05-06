import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, MapPin, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PROVINCE_TO_CODE, ITALIAN_PROVINCES } from '../../lib/cities';

const CODE_TO_PROVINCE: Record<string, string> = {};
Object.entries(PROVINCE_TO_CODE).forEach(([name, code]) => {
  CODE_TO_PROVINCE[code] = name;
});

function resolveProvinceName(value: string): string {
  if (!value) return '';
  if (/^[A-Z]{1,2}$/.test(value)) return CODE_TO_PROVINCE[value] || value;
  return value;
}

interface Props {
  province: string;
  city: string;
  onProvinceChange: (province: string, provinceCode: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function ItalianCityProvinceSelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  required = false,
  disabled = false,
}: Props) {
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  const provinceName = resolveProvinceName(province);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setProvinceOpen(false);
        setProvinceSearch('');
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
        setCitySearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (provinceOpen) setTimeout(() => provinceInputRef.current?.focus(), 50);
  }, [provinceOpen]);

  useEffect(() => {
    if (cityOpen) setTimeout(() => cityInputRef.current?.focus(), 50);
  }, [cityOpen]);

  const loadCities = useCallback(async (pName: string) => {
    if (!pName) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from('comuni_italiani')
        .select('comune')
        .eq('provincia', pName)
        .order('comune');
      if (!error && data) {
        setCities(data.map((r: { comune: string }) => r.comune));
      }
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    loadCities(provinceName);
  }, [provinceName, loadCities]);

  const filteredProvinces = ITALIAN_PROVINCES.filter(p =>
    p.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  function selectProvince(p: string) {
    const code = PROVINCE_TO_CODE[p] || '';
    onProvinceChange(p, code);
    onCityChange('');
    setProvinceOpen(false);
    setProvinceSearch('');
  }

  function selectCity(c: string) {
    onCityChange(c);
    setCityOpen(false);
    setCitySearch('');
  }

  function clearProvince(e: React.MouseEvent) {
    e.stopPropagation();
    onProvinceChange('', '');
    onCityChange('');
    setCities([]);
  }

  function clearCity(e: React.MouseEvent) {
    e.stopPropagation();
    onCityChange('');
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Provincia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            Provincia
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </label>
        <div ref={provinceRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => { if (!disabled) { setProvinceOpen(v => !v); setCityOpen(false); } }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-lg text-sm transition-all text-left bg-white ${
              disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-blue-400 cursor-pointer'
            } ${provinceOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-300'}`}
          >
            <span className={`flex-1 truncate ${provinceName ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {provinceName || 'Seleziona provincia...'}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {provinceName && !disabled && (
                <span onClick={clearProvince} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${provinceOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {provinceOpen && (
            <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={provinceInputRef}
                    type="text"
                    placeholder="Cerca provincia..."
                    value={provinceSearch}
                    onChange={e => setProvinceSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setProvinceOpen(false); setProvinceSearch(''); }
                      if (e.key === 'Enter' && filteredProvinces.length === 1) selectProvince(filteredProvinces[0]);
                    }}
                  />
                  {provinceSearch && (
                    <button type="button" onClick={() => setProvinceSearch('')} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                {filteredProvinces.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">Nessuna provincia trovata</div>
                ) : (
                  filteredProvinces.map(p => {
                    const code = PROVINCE_TO_CODE[p] || '';
                    const isSelected = p === provinceName;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => selectProvince(p)}
                        className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-blue-700' : ''}`}>{p}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0 ${
                          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {code}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
                {filteredProvinces.length} province
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comune */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            Comune
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </label>
        <div ref={cityRef} className="relative">
          <button
            type="button"
            disabled={disabled || !provinceName}
            onClick={() => { if (!disabled && provinceName) { setCityOpen(v => !v); setProvinceOpen(false); } }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-lg text-sm transition-all text-left bg-white ${
              disabled || !provinceName ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-blue-400 cursor-pointer'
            } ${cityOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-300'}`}
          >
            <span className={`flex-1 truncate ${city ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {city || (provinceName ? 'Seleziona comune...' : 'Prima scegli la provincia')}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {city && !disabled && (
                <span onClick={clearCity} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${cityOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {cityOpen && provinceName && (
            <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={cityInputRef}
                    type="text"
                    placeholder={`Cerca in ${provinceName}...`}
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setCityOpen(false); setCitySearch(''); }
                      if (e.key === 'Enter' && filteredCities.length === 1) selectCity(filteredCities[0]);
                    }}
                  />
                  {citySearch && (
                    <button type="button" onClick={() => setCitySearch('')} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                {loadingCities ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Caricamento comuni...
                  </div>
                ) : filteredCities.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    {citySearch ? 'Nessun comune trovato' : 'Nessun comune disponibile'}
                  </div>
                ) : (
                  filteredCities.map(c => {
                    const isSelected = c === city;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => selectCity(c)}
                        className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
                {loadingCities ? '...' : `${filteredCities.length} comuni`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
