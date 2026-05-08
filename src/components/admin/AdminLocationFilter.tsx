import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ITALIAN_REGIONS } from '../../lib/cities';

export interface LocationFilterState {
  region: string;
  province: string;     // full name, e.g. "Varese"
  provinceCode: string; // sigla, e.g. "VA"
  city: string;
}

interface Props {
  value: LocationFilterState;
  onChange: (v: LocationFilterState) => void;
  accentColor?: string;
}

export function AdminLocationFilter({ value, onChange, accentColor = 'blue' }: Props) {
  const [allProvinces, setAllProvinces] = useState<{ provincia: string; sigla: string }[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<{ provincia: string; sigla: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load ALL provinces once on mount
  useEffect(() => {
    setLoadingProvinces(true);
    supabase.rpc('get_all_province').then(({ data }) => {
      const provinces = data || [];
      setAllProvinces(provinces);
      setFilteredProvinces(provinces);
      setLoadingProvinces(false);
    });
  }, []);

  // Filter provinces when region changes
  useEffect(() => {
    if (!value.region) {
      setFilteredProvinces(allProvinces);
      return;
    }
    setLoadingProvinces(true);
    supabase.rpc('get_province_by_regione', { p_regione: value.region }).then(({ data }) => {
      setFilteredProvinces(data || []);
      setLoadingProvinces(false);
    });
  }, [value.region, allProvinces]);

  // Load cities when province changes
  useEffect(() => {
    if (!value.provinceCode) { setCities([]); return; }
    setLoadingCities(true);
    supabase.rpc('get_comuni_by_provincia', { p_provincia: value.provinceCode }).then(({ data }) => {
      setCities((data || []).map((r: { comune: string }) => r.comune));
      setLoadingCities(false);
    });
  }, [value.provinceCode]);

  const borderClass = `border-gray-300 focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Regione */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Regione</label>
        <select
          value={value.region}
          onChange={e => onChange({ region: e.target.value, province: '', provinceCode: '', city: '' })}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${borderClass}`}
        >
          <option value="">Tutte le regioni</option>
          {ITALIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Provincia — always enabled */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
        <select
          value={value.provinceCode}
          onChange={e => {
            const sigla = e.target.value;
            const found = filteredProvinces.find(p => p.sigla === sigla);
            onChange({ ...value, province: found?.provincia || '', provinceCode: sigla, city: '' });
          }}
          disabled={loadingProvinces}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${borderClass} disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="">{loadingProvinces ? 'Caricamento...' : 'Tutte le province'}</option>
          {filteredProvinces.map(p => (
            <option key={p.sigla} value={p.sigla}>{p.provincia} ({p.sigla})</option>
          ))}
        </select>
      </div>

      {/* Comune — enabled when province selected */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Comune</label>
        <select
          value={value.city}
          onChange={e => onChange({ ...value, city: e.target.value })}
          disabled={!value.provinceCode || loadingCities}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${borderClass} disabled:bg-gray-100 disabled:cursor-not-allowed`}
        >
          <option value="">{loadingCities ? 'Caricamento...' : !value.provinceCode ? 'Seleziona prima la provincia' : 'Tutti i comuni'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
