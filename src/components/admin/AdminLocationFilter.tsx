import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, ITALIAN_PROVINCES, PROVINCE_TO_CODE } from '../../lib/cities';

export interface LocationFilterState {
  region: string;
  province: string; // display name, e.g. "Milano"
  provinceCode: string; // short code, e.g. "MI"
  city: string;
}

interface Props {
  value: LocationFilterState;
  onChange: (v: LocationFilterState) => void;
  accentColor?: string;
}

export function AdminLocationFilter({ value, onChange, accentColor = 'blue' }: Props) {
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const provinces: string[] = value.region
    ? (PROVINCES_BY_REGION[value.region] ?? ITALIAN_PROVINCES)
    : ITALIAN_PROVINCES;

  const loadCities = useCallback(async (provCode: string) => {
    if (!provCode) { setCities([]); return; }
    setLoadingCities(true);
    // Query distinct cities from DB using the province code
    const { data } = await supabase
      .from('unclaimed_business_locations')
      .select('city')
      .eq('province', provCode)
      .order('city');
    const unique = [...new Set((data || []).map((r: { city: string }) => r.city).filter(Boolean))].sort();
    setCities(unique);
    setLoadingCities(false);
  }, []);

  useEffect(() => { loadCities(value.provinceCode); }, [value.provinceCode, loadCities]);

  const ring = `focus:ring-${accentColor}-500`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Regione */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Regione</label>
        <select
          value={value.region}
          onChange={e => onChange({ region: e.target.value, province: '', provinceCode: '', city: '' })}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${ring} focus:border-transparent bg-white`}
        >
          <option value="">Tutte le regioni</option>
          {ITALIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Provincia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
        <select
          value={value.province}
          onChange={e => {
            const name = e.target.value;
            const code = PROVINCE_TO_CODE[name] || '';
            onChange({ ...value, province: name, provinceCode: code, city: '' });
          }}
          disabled={!value.region}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${ring} focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="">Tutte le province</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Comune */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comune</label>
        <select
          value={value.city}
          onChange={e => onChange({ ...value, city: e.target.value })}
          disabled={!value.province || loadingCities}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${ring} focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="">{loadingCities ? 'Caricamento...' : 'Tutti i comuni'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
