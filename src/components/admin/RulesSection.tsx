import { useState, useEffect } from 'react';
import { BookOpen, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RuleCategory {
  id: string;
  setting_key: string;
  description: string;
  rules: string[];
}

interface RulesSectionProps {
  adminId: string;
}

export function RulesSection({ adminId }: RulesSectionProps) {
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<RuleCategory | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('category', 'rules')
        .order('setting_key');

      if (error) throw error;

      const rulesCategories = data?.map((item) => ({
        id: item.id,
        setting_key: item.setting_key,
        description: item.description,
        rules: item.setting_value.rules || [],
      })) || [];

      setCategories(rulesCategories);
    } catch (error: any) {
      console.error('Error loading rules:', error);
      alert('Errore nel caricamento delle regole');
    } finally {
      setLoading(false);
    }
  };

  const saveRules = async () => {
    if (!editingCategory) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('platform_settings')
        .update({
          setting_value: { rules: editingCategory.rules },
          updated_by: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      alert('Regole aggiornate con successo!');
      setEditingCategory(null);
      loadRules();
    } catch (error: any) {
      console.error('Error saving rules:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (!editingCategory) return;
    setEditingCategory({
      ...editingCategory,
      rules: [...editingCategory.rules, ''],
    });
  };

  const updateRule = (index: number, value: string) => {
    if (!editingCategory) return;
    const newRules = [...editingCategory.rules];
    newRules[index] = value;
    setEditingCategory({
      ...editingCategory,
      rules: newRules,
    });
  };

  const removeRule = (index: number) => {
    if (!editingCategory) return;
    const newRules = editingCategory.rules.filter((_, i) => i !== index);
    setEditingCategory({
      ...editingCategory,
      rules: newRules,
    });
  };

  const getCategoryTitle = (key: string) => {
    switch (key) {
      case 'rules_reviews':
        return 'Recensioni';
      case 'rules_classified_ads':
        return 'Annunci';
      case 'rules_messaging':
        return 'Messaggistica';
      case 'rules_points':
        return 'Sistema Punti';
      case 'rules_general':
        return 'Regole Generali';
      default:
        return key.replace('rules_', '').replace(/_/g, ' ');
    }
  };

  const getCategoryIcon = (key: string) => {
    const iconClass = "w-6 h-6";
    switch (key) {
      case 'rules_reviews':
        return '⭐';
      case 'rules_classified_ads':
        return '📢';
      case 'rules_messaging':
        return '💬';
      case 'rules_points':
        return '🏆';
      case 'rules_general':
        return '📋';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Regole</h2>
          <p className="text-sm text-gray-600 mt-1">
            Modifica le regole e linee guida della piattaforma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryIcon(category.setting_key)}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{getCategoryTitle(category.setting_key)}</h3>
                  <p className="text-blue-100 text-sm mt-1">{category.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-4">
                {category.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 text-sm flex-1">{rule}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setEditingCategory(category)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifica Regole
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">{getCategoryIcon(editingCategory.setting_key)}</span>
                  Modifica: {getCategoryTitle(editingCategory.setting_key)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{editingCategory.description}</p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  Regole ({editingCategory.rules.length})
                </label>
                <button
                  onClick={addRule}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Regola
                </button>
              </div>

              <div className="space-y-3">
                {editingCategory.rules.map((rule, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <textarea
                          value={rule}
                          onChange={(e) => updateRule(index, e.target.value)}
                          placeholder="Inserisci la regola..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                        title="Elimina regola"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingCategory.rules.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
                  <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                  <p className="text-yellow-800 font-medium">Nessuna regola presente</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    Clicca su "Aggiungi Regola" per iniziare
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={saveRules}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
