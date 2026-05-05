import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { CITIES_BY_PROVINCE, PROVINCE_TO_CODE, ITALIAN_PROVINCES } from '../../lib/cities';

// Build a reverse map: code -> full name
const CODE_TO_PROVINCE: Record<string, string> = {};
Object.entries(PROVINCE_TO_CODE).forEach(([name, code]) => {
  CODE_TO_PROVINCE[code] = name;
});

function resolveProvinceName(value: string): string {
  if (!value) return '';
  // If it looks like a code (1-2 uppercase letters), convert to name
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

  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

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

  const provinceName = resolveProvinceName(province);

  const filteredProvinces = ITALIAN_PROVINCES.filter(p =>
    p.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const availableCities = provinceName ? (CITIES_BY_PROVINCE[provinceName] || []) : [];
  const filteredCities = availableCities.filter(c =>
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
  }

  function clearCity(e: React.MouseEvent) {
    e.stopPropagation();
    onCityChange('');
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Province */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provincia {required && <span className="text-red-500">*</span>}
        </label>
        <div ref={provinceRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => { setProvinceOpen(v => !v); setCityOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-colors text-left ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-400 cursor-pointer'
            } ${provinceOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
          >
            <span className={provinceName ? 'text-gray-900' : 'text-gray-400'}>
              {provinceName || 'Seleziona provincia'}
            </span>
            <div className="flex items-center gap-1">
              {provinceName && !disabled && (
                <X
                  className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700"
                  onClick={clearProvince}
                />
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${provinceOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {provinceOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
              <div className="p-2 border-b">
                <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cerca provincia..."
                    value={provinceSearch}
                    onChange={e => setProvinceSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredProvinces.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">Nessun risultato</div>
                ) : (
                  filteredProvinces.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => selectProvince(p)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        p === provinceName ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {p}
                      <span className="ml-2 text-xs text-gray-400">({PROVINCE_TO_CODE[p]})</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comune {required && <span className="text-red-500">*</span>}
        </label>
        <div ref={cityRef} className="relative">
          <button
            type="button"
            disabled={disabled || !province}
            onClick={() => { setCityOpen(v => !v); setProvinceOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-colors text-left ${
              disabled || !provinceName ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white hover:border-blue-400 cursor-pointer'
            } ${cityOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
          >
            <span className={city ? 'text-gray-900' : 'text-gray-400'}>
              {city || (provinceName ? 'Seleziona comune' : 'Prima seleziona provincia')}
            </span>
            <div className="flex items-center gap-1">
              {city && !disabled && (
                <X
                  className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700"
                  onClick={clearCity}
                />
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {cityOpen && provinceName && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
              <div className="p-2 border-b">
                <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cerca comune..."
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredCities.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">Nessun risultato</div>
                ) : (
                  filteredCities.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => selectCity(c)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        c === city ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
