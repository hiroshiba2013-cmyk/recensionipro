import { Shield, HelpCircle, Cookie, FileText } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Leggi le regole e le FAQ
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">Regolamento e FAQ</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Tutto quello che devi sapere per utilizzare al meglio la piattaforma
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          <div className="border-b bg-gray-50 px-8 py-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <a href="#regolamento" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Regolamento
              </a>
              <a href="#faq" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                FAQ
              </a>
              <a href="#cookie-policy" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Cookie Policy
              </a>
              <a href="#termini" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Termini e Privacy
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
            <section id="cookie-policy">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-amber-200">
                <Cookie className="w-10 h-10 text-amber-600" />
                <h2 className="text-4xl font-bold text-gray-900">Cookie Policy</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                  <p className="text-amber-900 font-semibold text-lg mb-2">Informativa semplice e trasparente</p>
                  <p className="text-amber-800 leading-relaxed">
                    Trovafacile utilizza esclusivamente cookie tecnici necessari al funzionamento della piattaforma.
                    Non utilizziamo cookie di profilazione, non facciamo pubblicità comportamentale e
                    non vendiamo né condividiamo i tuoi dati con terze parti a scopo commerciale.
                  </p>
                </div>

                {[
                  {
                    title: 'Cookie tecnici e di sessione',
                    color: 'blue',
                    content: [
                      { label: 'Cookie di autenticazione', desc: 'Gestiti da Supabase, mantengono la tua sessione attiva dopo il login. Sono strettamente necessari al funzionamento del sito e non richiedono consenso.' },
                      { label: 'Cookie di preferenze', desc: 'Memorizzano impostazioni locali come la lingua selezionata o il profilo attivo. Non contengono dati personali identificativi.' },
                    ]
                  },
                  {
                    title: 'Cookie di terze parti (solo durante i pagamenti)',
                    color: 'orange',
                    content: [
                      { label: 'Stripe', desc: 'Quando accedi al checkout per acquistare un piano, Stripe può impostare cookie propri necessari per la sicurezza della transazione. Stripe è certificato PCI-DSS e la sua privacy policy è disponibile su stripe.com/privacy.' },
                    ]
                  },
                  {
                    title: 'Cosa NON facciamo',
                    color: 'green',
                    content: [
                      { label: 'Nessun tracciamento pubblicitario', desc: 'Non utilizziamo Google Ads, Meta Pixel, o qualsiasi altro sistema di tracciamento per la pubblicità.' },
                      { label: 'Nessuna vendita di dati', desc: 'I tuoi dati non vengono mai venduti, ceduti o condivisi con terze parti per scopi commerciali.' },
                      { label: 'Nessun cookie di analytics invasivo', desc: 'Non utilizziamo cookie di terze parti per analisi comportamentale degli utenti.' },
                    ]
                  },
                  {
                    title: 'Come gestire i cookie',
                    color: 'gray',
                    content: [
                      { label: 'Impostazioni del browser', desc: 'Puoi configurare il tuo browser per bloccare o eliminare i cookie. Tieni presente che disabilitare i cookie tecnici potrebbe compromettere il corretto funzionamento del sito (es. impossibilità di rimanere connesso).' },
                      { label: 'Cancellazione cookie', desc: 'Puoi eliminare i cookie salvati dal tuo browser in qualsiasi momento dalle impostazioni del browser stesso.' },
                    ]
                  },
                ].map(({ title, color, content }) => (
                  <div key={title} className={`bg-white border-2 border-${color}-100 rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold text-gray-900 mb-4 flex items-center gap-2`}>
                      <div className={`w-1.5 h-6 bg-${color}-500 rounded`}></div>
                      {title}
                    </h3>
                    <div className="space-y-4">
                      {content.map(({ label, desc }) => (
                        <div key={label} className="flex gap-3">
                          <div className={`w-2 h-2 rounded-full bg-${color}-400 flex-shrink-0 mt-2`}></div>
                          <div>
                            <span className="font-semibold text-gray-800">{label}: </span>
                            <span className="text-gray-600">{desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="termini">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-teal-200">
                <FileText className="w-10 h-10 text-teal-600" />
                <h2 className="text-4xl font-bold text-gray-900">Termini di Servizio e Privacy</h2>
              </div>

              <div className="space-y-6">
                {[
                  {
                    id: 'termini-servizio',
                    title: 'Termini di Servizio',
                    items: [
                      { label: 'Accettazione', text: 'Utilizzando Trovafacile accetti i presenti termini. Se non li accetti, ti chiediamo di non utilizzare il servizio.' },
                      { label: 'Descrizione del servizio', text: 'Trovafacile è una piattaforma italiana che consente agli utenti di cercare, recensire e scoprire attività commerciali locali, pubblicare annunci, partecipare ad aste e trovare opportunità di lavoro.' },
                      { label: 'Account utente', text: 'Sei responsabile della sicurezza del tuo account e delle attività svolte con esso. Devi fornire informazioni veritiere durante la registrazione.' },
                      { label: 'Contenuti pubblicati', text: 'Sei responsabile dei contenuti che pubblichi (recensioni, annunci, offerte di lavoro). Non è consentito pubblicare contenuti falsi, diffamatori, illegali o che violino i diritti di terzi.' },
                      { label: 'Sospensione account', text: 'Ci riserviamo il diritto di sospendere o eliminare account che violino i termini di servizio o le regole della community.' },
                      { label: 'Modifiche al servizio', text: 'Trovafacile può modificare, sospendere o interrompere il servizio in qualsiasi momento, con ragionevole preavviso agli utenti registrati.' },
                    ]
                  },
                  {
                    id: 'privacy-policy',
                    title: 'Privacy Policy',
                    items: [
                      { label: 'Titolare del trattamento', text: 'Il titolare del trattamento dei dati personali è Trovafacile. Per qualsiasi richiesta relativa alla privacy, puoi contattarci tramite la sezione Contatti.' },
                      { label: 'Dati raccolti', text: 'Raccogliamo i dati che fornisci durante la registrazione (nome, email, tipo di profilo), i contenuti che pubblichi sulla piattaforma, e i dati tecnici necessari al funzionamento del servizio (log di accesso, indirizzo IP).' },
                      { label: 'Finalità del trattamento', text: 'I tuoi dati vengono utilizzati esclusivamente per: erogare il servizio, gestire il tuo account, inviare comunicazioni di servizio (es. notifiche, conferme d\'ordine), e migliorare la piattaforma.' },
                      { label: 'Fornitori di servizio', text: 'Utilizziamo Supabase per il database e l\'autenticazione (dati protetti e cifrati), Stripe per la gestione sicura dei pagamenti (non archiviamo dati di carte di credito), e un servizio email per le comunicazioni automatiche di servizio.' },
                      { label: 'Conservazione dei dati', text: 'I tuoi dati vengono conservati per il tempo necessario all\'erogazione del servizio e come previsto dalla normativa vigente. Puoi richiedere la cancellazione del tuo account e dei tuoi dati in qualsiasi momento.' },
                      { label: 'I tuoi diritti (GDPR)', text: 'Hai diritto di accesso, rettifica, cancellazione ("diritto all\'oblio"), portabilità dei dati, opposizione al trattamento e limitazione del trattamento. Per esercitare questi diritti contattaci tramite la sezione Contatti.' },
                      { label: 'Trasferimento dati', text: 'I dati possono essere trasferiti verso paesi extra-UE (es. USA) esclusivamente attraverso fornitori certificati che garantiscono un livello di protezione adeguato (es. Standard Contractual Clauses).' },
                    ]
                  },
                  {
                    id: 'condizioni-uso',
                    title: "Condizioni d'uso",
                    items: [
                      { label: 'Uso lecito', text: 'La piattaforma deve essere utilizzata esclusivamente per scopi leciti e in conformità con la legislazione italiana ed europea vigente.' },
                      { label: 'Recensioni', text: 'Le recensioni devono essere veritiere e basate su esperienze dirette. È vietato pubblicare recensioni false, acquistare recensioni o manipolare il sistema di valutazione.' },
                      { label: 'Annunci e aste', text: 'Gli annunci e le aste devono riguardare prodotti o servizi reali. È vietato pubblicare offerte fraudolente, contraffatte o illegali.' },
                      { label: 'Rispetto della community', text: 'È richiesto un comportamento rispettoso verso gli altri utenti. Sono vietati insulti, discriminazioni, molestie o qualsiasi forma di comportamento lesivo della dignità altrui.' },
                      { label: 'Limitazione di responsabilità', text: 'Trovafacile non è responsabile per i contenuti pubblicati dagli utenti, per le transazioni tra utenti, o per eventuali danni derivanti dall\'uso della piattaforma da parte di terzi.' },
                    ]
                  },
                ].map(({ id, title, items }) => (
                  <div key={id} id={id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <div className="w-1.5 h-7 bg-teal-500 rounded"></div>
                      {title}
                    </h3>
                    <div className="space-y-4">
                      {items.map(({ label, text }) => (
                        <div key={label} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-2"></div>
                          <div>
                            <span className="font-semibold text-gray-800">{label}: </span>
                            <span className="text-gray-600 leading-relaxed">{text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 text-center">
                  <p className="text-teal-800 text-sm leading-relaxed">
                    Ultimo aggiornamento: maggio 2026. Per domande o chiarimenti su termini, privacy o cookie,
                    contattaci tramite la sezione <strong>Contatti</strong> della piattaforma.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
