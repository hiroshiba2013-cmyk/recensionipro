import { Shield, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface RulesContent {
  id: string;
  section_key: string;
  section_title: string;
  content_text: string;
  display_order: number;
  is_active: boolean;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

export function RulesPage() {
  const [rulesContent, setRulesContent] = useState<RulesContent[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [rulesResult, faqsResult] = await Promise.all([
        supabase
          .from('rules_content')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('category')
          .order('display_order')
      ]);

      if (rulesResult.error) throw rulesResult.error;
      if (faqsResult.error) throw faqsResult.error;

      setRulesContent(rulesResult.data || []);
      setFaqs(faqsResult.data || []);
    } catch (error: any) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Tutte', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const filteredFAQs = selectedCategory === 'Tutte'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Caricamento regolamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-12 text-white text-center">
            <Shield className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-5xl font-bold mb-4">Regolamento e FAQ</h1>
            <p className="text-xl text-blue-100">
              Tutto quello che devi sapere per utilizzare al meglio la piattaforma
            </p>
          </div>

          <div className="border-b bg-gray-50 px-8 py-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <a href="#regolamento" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Regolamento Completo
              </a>
              <a href="#faq" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                FAQ
              </a>
            </div>
          </div>

          <div className="p-8 space-y-16">
            <section id="regolamento">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-blue-200">
                <Shield className="w-10 h-10 text-blue-600" />
                <h2 className="text-4xl font-bold text-gray-900">Regolamento Completo</h2>
              </div>

              <div className="space-y-12">
                {rulesContent.map((section, index) => (
                  <div
                    key={section.id}
                    id={section.section_key}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 p-8 rounded-xl hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                          {section.section_title}
                        </h3>
                        <div className="prose prose-lg max-w-none">
                          <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {section.content_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rulesContent.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-12 text-center">
                  <Shield className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <p className="text-yellow-800 font-medium text-lg">
                    Nessun contenuto disponibile al momento
                  </p>
                </div>
              )}
            </section>

            <section id="faq">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-green-200">
                <HelpCircle className="w-10 h-10 text-green-600" />
                <h2 className="text-4xl font-bold text-gray-900">Domande Frequenti (FAQ)</h2>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Filtra per categoria:
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {Object.entries(groupedFAQs).map(([category, categoryFaqs]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-8 bg-blue-600 rounded"></div>
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {categoryFaqs.map((faq) => (
                        <div
                          key={faq.id}
                          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all shadow-sm"
                        >
                          <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            {faq.question}
                          </h4>
                          <p className="text-gray-700 leading-relaxed pl-7">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-12 text-center">
                  <HelpCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <p className="text-yellow-800 font-medium text-lg">
                    Nessuna FAQ disponibile{selectedCategory !== 'Tutte' ? ' in questa categoria' : ''}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
