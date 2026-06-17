import { useState, useEffect } from 'react';
import { Layers, FileEdit as Edit2, Check, X, Image, Type, Volume2, VolumeX, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';
import type { PageCustomization } from '../../hooks/usePageCustomization';

const PAGE_KEYS = [
  { key: 'landing', label: 'Home (senza login)', description: 'Pagina principale per visitatori non autenticati' },
  { key: 'home_authenticated', label: 'Home (con login)', description: 'Pagina principale per utenti autenticati' },
  { key: 'dashboard_private', label: 'Dashboard Privati', description: 'Dashboard per utenti privati' },
  { key: 'dashboard_business', label: 'Dashboard Business', description: 'Dashboard per utenti business' },
  { key: 'jobs', label: 'Sezione Lavoro', description: 'Pagina annunci di lavoro e candidature' },
  { key: 'search', label: 'Ricerca', description: 'Pagina di ricerca attività e prodotti' },
];

interface PageCardProps {
  page: typeof PAGE_KEYS[0];
  customization: PageCustomization | null;
  onSave: (pageKey: string, updates: Partial<PageCustomization>) => Promise<void>;
}

function PageCard({ page, customization, onSave }: PageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hero_title: customization?.hero_title ?? '',
    hero_subtitle: customization?.hero_subtitle ?? '',
    hero_image_url: customization?.hero_image_url ?? '',
    announcement_text: customization?.announcement_text ?? '',
    announcement_active: customization?.announcement_active ?? false,
  });

  useEffect(() => {
    setForm({
      hero_title: customization?.hero_title ?? '',
      hero_subtitle: customization?.hero_subtitle ?? '',
      hero_image_url: customization?.hero_image_url ?? '',
      announcement_text: customization?.announcement_text ?? '',
      announcement_active: customization?.announcement_active ?? false,
    });
  }, [customization]);

  const hasChanges =
    form.hero_title !== (customization?.hero_title ?? '') ||
    form.hero_subtitle !== (customization?.hero_subtitle ?? '') ||
    form.hero_image_url !== (customization?.hero_image_url ?? '') ||
    form.announcement_text !== (customization?.announcement_text ?? '') ||
    form.announcement_active !== (customization?.announcement_active ?? false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(page.key, {
        hero_title: form.hero_title || null,
        hero_subtitle: form.hero_subtitle || null,
        hero_image_url: form.hero_image_url || null,
        announcement_text: form.announcement_text || null,
        announcement_active: form.announcement_active,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      hero_title: customization?.hero_title ?? '',
      hero_subtitle: customization?.hero_subtitle ?? '',
      hero_image_url: customization?.hero_image_url ?? '',
      announcement_text: customization?.announcement_text ?? '',
      announcement_active: customization?.announcement_active ?? false,
    });
  };

  const activeCustomizations = [
    customization?.hero_title,
    customization?.hero_subtitle,
    customization?.hero_image_url,
    customization?.announcement_active ? customization.announcement_text : null,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            activeCustomizations > 0 ? 'bg-blue-600' : 'bg-gray-100'
          }`}>
            <Layers className={`w-5 h-5 ${activeCustomizations > 0 ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{page.label}</h3>
              {activeCustomizations > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {activeCustomizations} personalizzazioni
                </span>
              )}
              {customization?.announcement_active && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Annuncio attivo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{page.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-gray-400" />
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-6 space-y-6 bg-gray-50">
          {/* Hero section */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <Type className="w-4 h-4" />
              Testo Hero
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo principale</label>
              <input
                type="text"
                value={form.hero_title}
                onChange={e => setForm(f => ({ ...f, hero_title: e.target.value }))}
                placeholder="Lascia vuoto per usare il testo predefinito"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo</label>
              <textarea
                value={form.hero_subtitle}
                onChange={e => setForm(f => ({ ...f, hero_subtitle: e.target.value }))}
                placeholder="Lascia vuoto per usare il testo predefinito"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Hero image */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <Image className="w-4 h-4" />
              Immagine di sfondo
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL immagine</label>
              <input
                type="url"
                value={form.hero_image_url}
                onChange={e => setForm(f => ({ ...f, hero_image_url: e.target.value }))}
                placeholder="https://images.pexels.com/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {form.hero_image_url && (
                <div className="mt-2 rounded-xl overflow-hidden h-32">
                  <img
                    src={form.hero_image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Announcement banner */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              Banner annuncio
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testo annuncio</label>
              <textarea
                value={form.announcement_text}
                onChange={e => setForm(f => ({ ...f, announcement_text: e.target.value }))}
                placeholder="Es: Novità! Nuova funzionalità disponibile..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.announcement_active}
                  onChange={e => setForm(f => ({ ...f, announcement_active: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${form.announcement_active ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.announcement_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                {form.announcement_active ? (
                  <><Volume2 className="w-4 h-4 text-amber-500" /> Banner attivo</>
                ) : (
                  <><VolumeX className="w-4 h-4 text-gray-400" /> Banner disattivato</>
                )}
              </span>
            </label>
          </div>

          {/* Actions */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Salva modifiche
              </button>
            </div>
          )}

          {!hasChanges && customization?.updated_at && (
            <p className="text-xs text-gray-400 text-right">
              Ultima modifica: {new Date(customization.updated_at).toLocaleString('it-IT')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PageCustomizationSection({ adminId }: { adminId: string }) {
  const { showToast } = useToast();
  const [customizations, setCustomizations] = useState<Record<string, PageCustomization>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomizations();
  }, []);

  const loadCustomizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_customizations')
        .select('*');
      if (error) throw error;
      const map: Record<string, PageCustomization> = {};
      for (const item of data ?? []) {
        map[item.page_key] = item as PageCustomization;
      }
      setCustomizations(map);
    } catch (err) {
      console.error(err);
      showToast('Errore nel caricamento delle personalizzazioni', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageKey: string, updates: Partial<PageCustomization>) => {
    try {
      const existing = customizations[pageKey];
      if (existing) {
        const { error } = await supabase
          .from('page_customizations')
          .update({ ...updates, updated_at: new Date().toISOString(), updated_by: adminId })
          .eq('page_key', pageKey);
        if (error) throw error;
        setCustomizations(prev => ({
          ...prev,
          [pageKey]: { ...prev[pageKey], ...updates, updated_at: new Date().toISOString() },
        }));
      } else {
        const pageMeta = PAGE_KEYS.find(p => p.key === pageKey);
        const { data, error } = await supabase
          .from('page_customizations')
          .insert({ page_key: pageKey, page_name: pageMeta?.label ?? pageKey, ...updates, updated_by: adminId })
          .select()
          .single();
        if (error) throw error;
        setCustomizations(prev => ({ ...prev, [pageKey]: data as PageCustomization }));
      }
      showToast('Personalizzazioni salvate', 'success');
    } catch (err) {
      console.error(err);
      showToast('Errore nel salvataggio', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalActive = Object.values(customizations).filter(c =>
    c.hero_title || c.hero_subtitle || c.hero_image_url || c.announcement_active
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personalizzazione Pagine</h2>
              <p className="text-sm text-gray-500">
                Modifica testi, immagini e banner per ogni pagina della piattaforma
              </p>
            </div>
          </div>
          {totalActive > 0 && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100">
              {totalActive} pagine personalizzate
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{PAGE_KEYS.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Pagine disponibili</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{totalActive}</div>
            <div className="text-xs text-blue-600 mt-0.5">Con personalizzazioni</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {Object.values(customizations).filter(c => c.announcement_active).length}
            </div>
            <div className="text-xs text-amber-600 mt-0.5">Banner attivi</div>
          </div>
        </div>
      </div>

      {/* Page cards */}
      <div className="space-y-3">
        {PAGE_KEYS.map(page => (
          <PageCard
            key={page.key}
            page={page}
            customization={customizations[page.key] ?? null}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}
