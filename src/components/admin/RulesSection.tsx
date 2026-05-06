import { useState, useEffect } from 'react';
import { BookOpen, FileEdit as Edit, Save, X, Plus, Trash2, HelpCircle, Shield, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

interface RulesContent {
  id: string;
  section_key: string;
  section_title: string;
  content_text: string;
  display_order: number;
  is_active: boolean;
}

interface RulesSectionProps {
  adminId: string;
}

export function RulesSection({ adminId }: RulesSectionProps) {
  const [activeTab, setActiveTab] = useState<'faqs' | 'rules'>('rules');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [rulesContent, setRulesContent] = useState<RulesContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [editingRule, setEditingRule] = useState<RulesContent | null>(null);
  const [isNewFAQ, setIsNewFAQ] = useState(false);
  const [isNewRule, setIsNewRule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select('*')
        .order('category')
        .order('display_order');

      if (faqsError) throw faqsError;
      setFaqs(faqsData || []);

      // Load Rules Content
      const { data: rulesData, error: rulesError } = await supabase
        .from('rules_content')
        .select('*')
        .order('display_order');

      if (rulesError) throw rulesError;
      setRulesContent(rulesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      alert('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const saveFAQ = async () => {
    if (!editingFAQ) return;

    try {
      setSaving(true);

      if (isNewFAQ) {
        const { error } = await supabase
          .from('faqs')
          .insert({
            category: editingFAQ.category,
            question: editingFAQ.question,
            answer: editingFAQ.answer,
            display_order: editingFAQ.display_order,
            is_active: editingFAQ.is_active,
            updated_by: adminId,
          });

        if (error) throw error;
        alert('FAQ aggiunta con successo!');
      } else {
        const { error } = await supabase
          .from('faqs')
          .update({
            category: editingFAQ.category,
            question: editingFAQ.question,
            answer: editingFAQ.answer,
            display_order: editingFAQ.display_order,
            is_active: editingFAQ.is_active,
            updated_by: adminId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFAQ.id);

        if (error) throw error;
        alert('FAQ aggiornata con successo!');
      }

      setEditingFAQ(null);
      setIsNewFAQ(false);
      loadFAQs();
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa FAQ?')) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('FAQ eliminata con successo!');
      loadFAQs();
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const addNewFAQ = () => {
    setEditingFAQ({
      id: '',
      category: 'Generale',
      question: '',
      answer: '',
      display_order: faqs.length + 1,
      is_active: true,
    });
    setIsNewFAQ(true);
  };

  const saveRule = async () => {
    if (!editingRule) return;

    try {
      setSaving(true);

      if (isNewRule) {
        const { error } = await supabase
          .from('rules_content')
          .insert({
            section_key: editingRule.section_key,
            section_title: editingRule.section_title,
            content_text: editingRule.content_text,
            display_order: editingRule.display_order,
            is_active: editingRule.is_active,
            updated_by: adminId,
          });

        if (error) throw error;
        alert('Contenuto aggiunto con successo!');
      } else {
        const { error } = await supabase
          .from('rules_content')
          .update({
            section_key: editingRule.section_key,
            section_title: editingRule.section_title,
            content_text: editingRule.content_text,
            display_order: editingRule.display_order,
            is_active: editingRule.is_active,
            updated_by: adminId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        alert('Contenuto aggiornato con successo!');
      }

      setEditingRule(null);
      setIsNewRule(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo contenuto?')) return;

    try {
      const { error } = await supabase
        .from('rules_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Contenuto eliminato con successo!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const addNewRule = () => {
    setEditingRule({
      id: '',
      section_key: '',
      section_title: '',
      content_text: '',
      display_order: rulesContent.length + 1,
      is_active: true,
    });
    setIsNewRule(true);
  };

  const categories = ['Tutte', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const filteredFAQs = selectedCategory === 'Tutte'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6">
        {/* Dot overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Contenuti Piattaforma
            </p>
            <h2 className="text-2xl font-bold text-white">Regole e FAQ</h2>
          </div>
          <button
            onClick={activeTab === 'rules' ? addNewRule : addNewFAQ}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'rules' ? 'Nuovo' : 'Nuovo'}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Regole ({rulesContent.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'faqs'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          FAQ ({faqs.length})
        </button>
      </div>

      <div>
        {activeTab === 'rules' ? (
          <div className="space-y-3">
            {rulesContent.map((rule) => (
              <div key={rule.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        Ordine: {rule.display_order}
                      </span>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {rule.section_key}
                      </span>
                      {rule.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Attiva
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          Disattivata
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{rule.section_title}</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-4">{rule.content_text}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setIsNewRule(false);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Modifica
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina
                  </button>
                </div>
              </div>
            ))}

            {rulesContent.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Nessun contenuto presente</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category filter pills */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-xl px-3 py-1 text-sm font-medium transition ${
                      selectedCategory === category
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {faq.category}
                        </span>
                        {faq.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Attiva
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Disattivata
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-700 text-sm">{faq.answer}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setEditingFAQ(faq);
                        setIsNewFAQ(false);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Modifica
                    </button>
                    <button
                      onClick={() => deleteFAQ(faq.id)}
                      className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  </div>
                </div>
              ))}

              {filteredFAQs.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Nessuna FAQ presente in questa categoria</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {editingFAQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <HelpCircle className="w-8 h-8 text-gray-300" />
                  {isNewFAQ ? 'Aggiungi Nuova FAQ' : 'Modifica FAQ'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingFAQ(null);
                  setIsNewFAQ(false);
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={editingFAQ.category}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Iscrizione e Account">Iscrizione e Account</option>
                  <option value="Punti e Classifica">Punti e Classifica</option>
                  <option value="Recensioni">Recensioni</option>
                  <option value="Annunci">Annunci</option>
                  <option value="Lavoro">Lavoro</option>
                  <option value="Solidarietà">Solidarietà</option>
                  <option value="Aziende">Aziende</option>
                  <option value="Abbonamenti">Abbonamenti</option>
                  <option value="Privacy e Sicurezza">Privacy e Sicurezza</option>
                  <option value="Generale">Generale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domanda *
                </label>
                <input
                  type="text"
                  value={editingFAQ.question}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                  placeholder="Inserisci la domanda..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risposta *
                </label>
                <textarea
                  value={editingFAQ.answer}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                  placeholder="Inserisci la risposta..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordine di visualizzazione
                  </label>
                  <input
                    type="number"
                    value={editingFAQ.display_order}
                    onChange={(e) => setEditingFAQ({ ...editingFAQ, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato
                  </label>
                  <div className="flex items-center gap-4 h-10">
                    <button
                      type="button"
                      onClick={() => setEditingFAQ({ ...editingFAQ, is_active: !editingFAQ.is_active })}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        editingFAQ.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {editingFAQ.is_active ? 'Attiva' : 'Disattivata'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setEditingFAQ(null);
                    setIsNewFAQ(false);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={saveFAQ}
                  disabled={saving || !editingFAQ.question || !editingFAQ.answer}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvataggio...' : isNewFAQ ? 'Aggiungi FAQ' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Shield className="w-8 h-8 text-gray-300" />
                  {isNewRule ? 'Aggiungi Nuovo Contenuto' : 'Modifica Contenuto'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setIsNewRule(false);
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chiave Sezione * (usata per identificazione interna)
                </label>
                <input
                  type="text"
                  value={editingRule.section_key}
                  onChange={(e) => setEditingRule({ ...editingRule, section_key: e.target.value })}
                  placeholder="es: intro, getting_started, reviews_rules"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Usa underscore per separare le parole, tutto minuscolo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo Sezione *
                </label>
                <input
                  type="text"
                  value={editingRule.section_title}
                  onChange={(e) => setEditingRule({ ...editingRule, section_title: e.target.value })}
                  placeholder="es: Recensioni - Regole Fondamentali"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenuto * (supporta testo multilinea)
                </label>
                <textarea
                  value={editingRule.content_text}
                  onChange={(e) => setEditingRule({ ...editingRule, content_text: e.target.value })}
                  placeholder="Inserisci il contenuto della sezione...&#10;&#10;Puoi usare più righe.&#10;Vai a capo per creare paragrafi.&#10;&#10;Esempio:&#10;TITOLO SEZIONE&#10;Testo descrittivo...&#10;&#10;SOTTOSEZIONE&#10;Altro testo..."
                  rows={20}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa righe vuote per separare paragrafi. Supporta testo formattato con simboli (✓, ❌, •, etc.)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordine di visualizzazione
                  </label>
                  <input
                    type="number"
                    value={editingRule.display_order}
                    onChange={(e) => setEditingRule({ ...editingRule, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato
                  </label>
                  <div className="flex items-center gap-4 h-10">
                    <button
                      type="button"
                      onClick={() => setEditingRule({ ...editingRule, is_active: !editingRule.is_active })}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        editingRule.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {editingRule.is_active ? 'Attiva' : 'Disattivata'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setEditingRule(null);
                    setIsNewRule(false);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Annulla
                </button>
                <button
                  onClick={saveRule}
                  disabled={saving || !editingRule.section_key || !editingRule.section_title || !editingRule.content_text}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvataggio...' : isNewRule ? 'Aggiungi Contenuto' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
