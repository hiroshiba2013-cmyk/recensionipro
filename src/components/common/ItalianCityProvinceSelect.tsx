import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, MapPin, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  province: string;
  city: string;
  onProvinceChange: (province: string, provinceCode: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
}

// Sigla provincia per nome (usata solo per display)
const PROVINCE_CODES: Record<string, string> = {
  'Agrigento': 'AG', 'Alessandria': 'AL', 'Ancona': 'AN', 'Arezzo': 'AR',
  'Ascoli Piceno': 'AP', 'Asti': 'AT', 'Avellino': 'AV', 'Bari': 'BA',
  'Barletta-Andria-Trani': 'BT', 'Belluno': 'BL', 'Benevento': 'BN',
  'Bergamo': 'BG', 'Biella': 'BI', 'Bologna': 'BO', 'Bolzano': 'BZ',
  'Brescia': 'BS', 'Brindisi': 'BR', 'Cagliari': 'CA', 'Caltanissetta': 'CL',
  'Campobasso': 'CB', 'Caserta': 'CE', 'Catania': 'CT', 'Catanzaro': 'CZ',
  'Chieti': 'CH', 'Como': 'CO', 'Cosenza': 'CS', 'Cremona': 'CR',
  'Crotone': 'KR', 'Cuneo': 'CN', 'Enna': 'EN', 'Fermo': 'FM',
  'Ferrara': 'FE', 'Firenze': 'FI', 'Foggia': 'FG', 'Forlì-Cesena': 'FC',
  'Frosinone': 'FR', 'Genova': 'GE', 'Gorizia': 'GO', 'Grosseto': 'GR',
  'Imperia': 'IM', 'Isernia': 'IS', "L'Aquila": 'AQ', 'La Spezia': 'SP',
  'Latina': 'LT', 'Lecce': 'LE', 'Lecco': 'LC', 'Livorno': 'LI',
  'Lodi': 'LO', 'Lucca': 'LU', 'Macerata': 'MC', 'Mantova': 'MN',
  'Massa-Carrara': 'MS', 'Matera': 'MT', 'Messina': 'ME', 'Milano': 'MI',
  'Modena': 'MO', 'Monza e Brianza': 'MB', 'Napoli': 'NA', 'Novara': 'NO',
  'Nuoro': 'NU', 'Oristano': 'OR', 'Padova': 'PD', 'Palermo': 'PA',
  'Parma': 'PR', 'Pavia': 'PV', 'Perugia': 'PG', 'Pesaro e Urbino': 'PU',
  'Pescara': 'PE', 'Piacenza': 'PC', 'Pisa': 'PI', 'Pistoia': 'PT',
  'Pordenone': 'PN', 'Potenza': 'PZ', 'Prato': 'PO', 'Ragusa': 'RG',
  'Ravenna': 'RA', 'Reggio Calabria': 'RC', 'Reggio Emilia': 'RE',
  'Rieti': 'RI', 'Rimini': 'RN', 'Roma': 'RM', 'Rovigo': 'RO',
  'Salerno': 'SA', 'Sassari': 'SS', 'Savona': 'SV', 'Siena': 'SI',
  'Siracusa': 'SR', 'Sondrio': 'SO', 'Sud Sardegna': 'SU', 'Taranto': 'TA',
  'Teramo': 'TE', 'Terni': 'TR', 'Torino': 'TO', 'Trapani': 'TP',
  'Trento': 'TN', 'Treviso': 'TV', 'Trieste': 'TS', 'Udine': 'UD',
  "Valle d'Aosta": 'AO', 'Varese': 'VA', 'Venezia': 'VE',
  'Verbano-Cusio-Ossola': 'VB', 'Vercelli': 'VC', 'Verona': 'VR',
  'Vibo Valentia': 'VV', 'Vicenza': 'VI', 'Viterbo': 'VT',
};

export function ItalianCityProvinceSelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  required = false,
  disabled = false,
}: Props) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Load provinces from DB once
  useEffect(() => {
    setLoadingProvinces(true);
    supabase
      .from('comuni_italiani')
      .select('provincia')
      .order('provincia')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r: { provincia: string }) => r.provincia))];
          setProvinces(unique);
        }
        setLoadingProvinces(false);
      });
  }, []);

  const loadCities = useCallback(async (prov: string) => {
    if (!prov) { setCities([]); return; }
    setLoadingCities(true);
    const { data } = await supabase
      .from('comuni_italiani')
      .select('comune')
      .eq('provincia', prov)
      .order('comune');
    setCities(data ? data.map((r: { comune: string }) => r.comune) : []);
    setLoadingCities(false);
  }, []);

  useEffect(() => {
    loadCities(province);
  }, [province, loadCities]);

  // Close on outside click
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

  const filteredProvinces = provinces.filter(p =>
    p.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  function selectProvince(p: string) {
    const code = PROVINCE_CODES[p] || '';
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

  const dropdownStyle: React.CSSProperties = {
    minWidth: '100%',
    width: 'max-content',
    maxWidth: '320px',
    maxHeight: '320px',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
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
            <span className={`flex-1 min-w-0 truncate ${province ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {province || 'Seleziona provincia...'}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {province && !disabled && (
                <span onClick={clearProvince} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${provinceOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {provinceOpen && (
            <div className="absolute z-[300] left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col" style={dropdownStyle}>
              <div className="p-2.5 border-b border-gray-100 bg-gray-50 rounded-t-xl flex-shrink-0">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={provinceInputRef}
                    type="text"
                    placeholder="Cerca provincia..."
                    value={provinceSearch}
                    onChange={e => setProvinceSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 min-w-0"
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setProvinceOpen(false); setProvinceSearch(''); }
                      if (e.key === 'Enter' && filteredProvinces.length === 1) selectProvince(filteredProvinces[0]);
                    }}
                  />
                  {provinceSearch && (
                    <button type="button" onClick={() => setProvinceSearch('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingProvinces ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">Caricamento...</div>
                ) : filteredProvinces.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">Nessuna provincia trovata</div>
                ) : (
                  filteredProvinces.map(p => {
                    const code = PROVINCE_CODES[p] || '';
                    const isSelected = p === province;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => selectProvince(p)}
                        className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium flex-1 min-w-0">{p}</span>
                        {code && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0 ${
                            isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                          }`}>{code}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-xl text-xs text-gray-400 text-right flex-shrink-0">
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
            disabled={disabled || !province}
            onClick={() => { if (!disabled && province) { setCityOpen(v => !v); setProvinceOpen(false); } }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-lg text-sm transition-all text-left bg-white ${
              disabled || !province ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-blue-400 cursor-pointer'
            } ${cityOpen ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-300'}`}
          >
            <span className={`flex-1 min-w-0 truncate ${city ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {city || (province ? 'Seleziona comune...' : 'Prima scegli la provincia')}
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

          {cityOpen && province && (
            <div className="absolute z-[300] left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col" style={dropdownStyle}>
              <div className="p-2.5 border-b border-gray-100 bg-gray-50 rounded-t-xl flex-shrink-0">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={cityInputRef}
                    type="text"
                    placeholder={`Cerca in ${province}...`}
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 min-w-0"
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setCityOpen(false); setCitySearch(''); }
                      if (e.key === 'Enter' && filteredCities.length === 1) selectCity(filteredCities[0]);
                    }}
                  />
                  {citySearch && (
                    <button type="button" onClick={() => setCitySearch('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
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
                        className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors whitespace-nowrap ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-xl text-xs text-gray-400 text-right flex-shrink-0">
                {loadingCities ? '...' : `${filteredCities.length} comuni`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
