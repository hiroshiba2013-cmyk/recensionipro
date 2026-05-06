import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, ITALIAN_PROVINCES } from '../../lib/cities';

export interface LocationFilterState {
  region: string;
  province: string;
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

  const loadCities = useCallback(async (prov: string) => {
    if (!prov) { setCities([]); return; }
    setLoadingCities(true);
    const { data } = await supabase.rpc('get_comuni_by_provincia', { p_provincia: prov });
    setCities(data ? data.map((r: { comune: string }) => r.comune) : []);
    setLoadingCities(false);
  }, []);

  useEffect(() => { loadCities(value.province); }, [value.province, loadCities]);

  const ring = `focus:ring-${accentColor}-500`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Regione */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Regione</label>
        <select
          value={value.region}
          onChange={e => onChange({ region: e.target.value, province: '', city: '' })}
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
          onChange={e => onChange({ ...value, province: e.target.value, city: '' })}
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
