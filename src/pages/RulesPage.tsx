import { Shield, FileText, AlertCircle, CheckCircle, Award, Tag, Briefcase, Building, Star, HelpCircle, UserPlus, Users, Heart, MessageSquare, MapPin, Gift, TrendingUp, Lock, Home } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Iscrizione e Account',
    question: 'Come mi iscrivo alla piattaforma?',
    answer: 'Clicca su "Registrati", scegli tra account Cliente o Business, inserisci email e password. Gli account Cliente hanno 3 mesi di prova gratuita, poi partono da 0,49€/mese. Gli account Business partono da 2,49€/mese + IVA dopo la prova.'
  },
  {
    category: 'Iscrizione e Account',
    question: 'Qual è la differenza tra account Cliente e Business?',
    answer: 'L\'account Cliente è per privati che vogliono lasciare recensioni, pubblicare annunci e cercare lavoro. L\'account Business è per aziende che vogliono gestire la propria attività, rispondere a recensioni, pubblicare offerte di lavoro e gestire più sedi.'
  },
  {
    category: 'Iscrizione e Account',
    question: 'Posso avere più account sulla piattaforma?',
    answer: 'No, ogni utente può avere un solo account. Tuttavia, gli account Cliente possono aggiungere fino a 4 membri della famiglia con profili separati. È vietato creare account multipli per guadagnare punti o aggirare le regole.'
  },
  {
    category: 'Iscrizione e Account',
    question: 'Come funziona il PIN per i profili familiari?',
    answer: 'Puoi impostare un PIN a 4 cifre per proteggere i profili dei membri della famiglia. Questo impedisce ad altri di accedere o modificare i loro profili. Il PIN può essere impostato nelle impostazioni del profilo.'
  },
  {
    category: 'Punti e Classifica',
    question: 'Come funziona il sistema dei punti?',
    answer: 'Guadagni punti per ogni attività: annunci (5pt), prodotti (10pt), segnalazioni attività (20pt), recensioni approvate (25pt base o 50pt con prova), presenta un amico che si abbona (30pt). I punti ti posizionano nella classifica mensile e ti fanno guadagnare badge.'
  },
  {
    category: 'Punti e Classifica',
    question: 'Quando ricevo i punti per una recensione?',
    answer: 'I punti vengono assegnati solo quando la tua recensione viene approvata dallo staff (entro 7 giorni). Ricevi 25 punti per una recensione base o 50 punti se alleghi prove documentali come scontrini o fatture. Se la recensione viene rifiutata, non riceverai punti.'
  },
  {
    category: 'Punti e Classifica',
    question: 'Come funziona il "Presenta un Amico"?',
    answer: 'Condividi il tuo nickname con amici e familiari. Quando si registrano inserendo il tuo nickname nel campo apposito e poi completano l\'abbonamento alla piattaforma, guadagni automaticamente 30 punti. La semplice registrazione non è sufficiente.'
  },
  {
    category: 'Punti e Classifica',
    question: 'La classifica si azzera?',
    answer: 'Sì, la classifica viene azzerata ogni anno il 1° gennaio per dare a tutti una nuova opportunità. I badge e i premi guadagnati restano permanentemente nel tuo profilo.'
  },
  {
    category: 'Recensioni',
    question: 'Come scrivo una recensione?',
    answer: 'Cerca l\'azienda, vai sulla sua pagina e clicca "Scrivi Recensione". Valuta servizio, qualità/prezzo, puntualità e disponibilità. Aggiungi un commento dettagliato e, se vuoi 50 punti invece di 25, carica una prova (scontrino, fattura, foto).'
  },
  {
    category: 'Recensioni',
    question: 'Posso modificare una recensione dopo averla pubblicata?',
    answer: 'No, una volta pubblicata la recensione non può essere modificata. Se hai commesso un errore, contatta il supporto. Le aziende possono rispondere alle recensioni per fornire chiarimenti.'
  },
  {
    category: 'Recensioni',
    question: 'Quanto tempo ci vuole per approvare una recensione?',
    answer: 'Le recensioni vengono verificate entro 7 giorni dalla pubblicazione. Durante questo periodo la recensione è visibile ma contrassegnata come "In revisione". I punti vengono assegnati solo dopo l\'approvazione.'
  },
  {
    category: 'Recensioni',
    question: 'Posso lasciare recensioni anche per attività non ancora registrate?',
    answer: 'Sì! Puoi recensire qualsiasi attività presente nel nostro database, anche se non è stata ancora rivendicata dal proprietario. Questo aiuta altri utenti a trovare servizi di qualità.'
  },
  {
    category: 'Annunci',
    question: 'Quanti annunci gratuiti posso pubblicare?',
    answer: 'Puoi pubblicare fino a 20 annunci contemporaneamente. Gli annunci scadono dopo 30 giorni ma possono essere rinnovati gratuitamente. Ogni annuncio pubblicato ti fa guadagnare 5 punti.'
  },
  {
    category: 'Annunci',
    question: 'Che tipi di annunci posso pubblicare?',
    answer: 'Puoi pubblicare annunci di Vendita, Acquisto, Scambio o Regalo nelle categorie: Veicoli, Immobili, Elettronica, Casa e Giardino, Moda, Sport, Animali, Servizi e altro. Alcune categorie richiedono documenti specifici.'
  },
  {
    category: 'Annunci',
    question: 'Come funziona la messaggistica con gli interessati?',
    answer: 'Gli utenti interessati ti contattano tramite messaggistica interna. Per sicurezza, incontra sempre gli acquirenti in luoghi pubblici e non condividere dati personali sensibili prima di valutare l\'affidabilità della persona.'
  },
  {
    category: 'Annunci',
    question: 'Cosa succede se pubblico prodotti vietati?',
    answer: 'Gli annunci con prodotti vietati (armi, droga, contraffazioni, tabacco, farmaci, documenti falsi) vengono rimossi immediatamente e l\'account può essere sospeso permanentemente.'
  },
  {
    category: 'Lavoro',
    question: 'Come funziona la ricerca di lavoro?',
    answer: 'Crea un profilo "Cerca Lavoro" con le tue competenze, esperienza e CV. Le aziende possono vedere il tuo profilo e contattarti direttamente. Puoi anche rispondere agli annunci di lavoro pubblicati dalle aziende.'
  },
  {
    category: 'Lavoro',
    question: 'Posso creare profili di ricerca lavoro per i miei familiari?',
    answer: 'Sì! Puoi aggiungere fino a 4 membri della famiglia e creare un profilo "Cerca Lavoro" per ciascuno di loro. Ogni membro può avere competenze, esperienza e CV diversi.'
  },
  {
    category: 'Lavoro',
    question: 'Come rispondo a un annuncio di lavoro?',
    answer: 'Clicca sull\'annuncio che ti interessa e poi su "Candidati". Puoi inviare un messaggio personalizzato all\'azienda. L\'azienda riceverà il tuo profilo e potrà contattarti.'
  },
  {
    category: 'Solidarietà',
    question: 'Cos\'è la sezione Solidarietà?',
    answer: 'È uno spazio dove persone in difficoltà economica possono richiedere aiuti (alimentari, vestiario, bollette, medicine) e altri utenti possono offrire supporto. È completamente gratuita e anonima se desiderato.'
  },
  {
    category: 'Solidarietà',
    question: 'Come richiedo aiuto nella sezione Solidarietà?',
    answer: 'Crea una richiesta spiegando la tua situazione e il tipo di aiuto necessario. Puoi caricare documenti che attestano la difficoltà (ISEE, certificati). Le richieste vengono verificate dallo staff prima della pubblicazione.'
  },
  {
    category: 'Solidarietà',
    question: 'Come posso aiutare qualcuno?',
    answer: 'Vai nella sezione Solidarietà, cerca richieste nella tua zona e contatta direttamente la persona tramite messaggistica interna. Puoi offrire beni, servizi o supporto economico in totale sicurezza.'
  },
  {
    category: 'Aziende',
    question: 'Come rivendico la mia azienda?',
    answer: 'Registrati come account Business, cerca la tua azienda nel database e clicca "Rivendica". Fornisci Partita IVA, Codice Fiscale, Codice Univoco SDI, PEC e Codice ATECO. La verifica richiede 24-48 ore.'
  },
  {
    category: 'Aziende',
    question: 'La mia azienda non è nel database, come la aggiungo?',
    answer: 'Gli utenti privati possono segnalare attività mancanti (20 punti). Come azienda, puoi creare direttamente la tua scheda durante il processo di rivendicazione fornendo tutti i dati necessari.'
  },
  {
    category: 'Aziende',
    question: 'Posso gestire più punti vendita?',
    answer: 'Sì! Una volta rivendicata l\'azienda puoi aggiungere e gestire tutte le tue sedi dalla sezione "Le Mie Sedi". Ogni sede può avere orari, contatti, foto e informazioni indipendenti.'
  },
  {
    category: 'Aziende',
    question: 'Gli annunci di lavoro per le aziende sono a pagamento?',
    answer: 'No, le aziende verificate possono pubblicare annunci di lavoro gratuitamente senza limiti. Gli annunci restano attivi fino alla data di scadenza che imposti.'
  },
  {
    category: 'Aziende',
    question: 'Come rispondo alle recensioni?',
    answer: 'Vai sulla pagina della tua sede, trova la recensione e clicca "Rispondi". La tua risposta apparirà sotto la recensione ed è visibile a tutti. Rispondi sempre in modo professionale e costruttivo.'
  },
  {
    category: 'Aziende',
    question: 'Posso creare offerte e sconti per i clienti?',
    answer: 'Sì, puoi creare sconti esclusivi per gli utenti della piattaforma. Gli utenti potranno riscattare gli sconti presentando un codice QR verificato in sede.'
  },
  {
    category: 'Abbonamenti',
    question: 'Quali sono i piani di abbonamento?',
    answer: 'Per Clienti: da 0,49€/mese (1 persona) a 1,49€/mese (4 persone). Per Business: da 2,49€/mese + IVA (1 sede) a tariffe personalizzate per 10+ sedi. Piani annuali con sconto fino al 30%. Tutti includono 3 mesi di prova gratuita.'
  },
  {
    category: 'Abbonamenti',
    question: 'Come funziona la prova gratuita?',
    answer: 'Attiva 3 mesi di prova gratuita senza carta di credito. Riceverai un promemoria 7 giorni prima della scadenza. Se non rinnovi, l\'abbonamento scade automaticamente senza addebiti.'
  },
  {
    category: 'Abbonamenti',
    question: 'Posso disdire in qualsiasi momento?',
    answer: 'Sì, puoi disdire dalla pagina Abbonamento. Se hai già pagato, manterrai l\'accesso fino alla scadenza del periodo pagato. Non sono previsti rimborsi per periodi parzialmente utilizzati.'
  },
  {
    category: 'Privacy e Sicurezza',
    question: 'I miei dati sono al sicuro?',
    answer: 'Sì, trattiamo i dati in conformità al GDPR. I dati vengono usati solo per i servizi della piattaforma e non vengono condivisi con terze parti senza consenso. Le password sono crittografate.'
  },
  {
    category: 'Privacy e Sicurezza',
    question: 'Come elimino il mio account?',
    answer: 'Vai su Profilo → Zona Pericolosa → Elimina Account. L\'eliminazione è permanente e cancellerà tutti i tuoi dati (recensioni, annunci, messaggi, punti). Non sono previsti rimborsi per abbonamenti attivi.'
  },
  {
    category: 'Generale',
    question: 'Come segnalo contenuti inappropriati?',
    answer: 'Usa il pulsante "Segnala" presente su recensioni, annunci e profili. Il nostro team esaminerà la segnalazione entro 24-48 ore. Le segnalazioni sono anonime e prese molto sul serio.'
  },
  {
    category: 'Generale',
    question: 'La piattaforma è disponibile su mobile?',
    answer: 'Sì, TrovaFacile è completamente ottimizzato per smartphone e tablet. Accedi da qualsiasi browser mobile senza bisogno di scaricare un\'app.'
  }
];

export function RulesPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [activeSection, setActiveSection] = useState<string>('');

  const categories = ['Tutte', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const filteredFAQs = selectedCategory === 'Tutte'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Guida Completa TrovaFacile</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Tutto quello che devi sapere per utilizzare al meglio la piattaforma
            </p>
          </div>

          <div className="border-b bg-gray-50 px-8 py-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <a href="#iniziare" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Come Iniziare
              </a>
              <a href="#privati" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Guida Privati
              </a>
              <a href="#business" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Guida Aziende
              </a>
              <a href="#regole" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Regole
              </a>
              <a href="#legale" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                Aspetti Legali
              </a>
              <a href="#faq" className="px-4 py-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                FAQ
              </a>
            </div>
          </div>

          <div className="p-8 space-y-16">
            <section id="iniziare">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-blue-200">
                <UserPlus className="w-10 h-10 text-blue-600" />
                <h2 className="text-4xl font-bold text-gray-900">Come Iniziare</h2>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-8 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                    Registrazione
                  </h3>
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg">
                      <strong>Passo 1:</strong> Clicca su "Accedi" o "Inizia Gratis"
                    </p>
                    <p className="text-lg">
                      <strong>Passo 2:</strong> Scegli il tipo di account:
                    </p>
                    <div className="ml-4 max-w-md">
                      <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-6 h-6 text-blue-600" />
                          <h4 className="font-bold text-xl">Account Privato</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Fino a 4 membri della famiglia</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Scrivi recensioni e guadagna punti</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Pubblica fino a 20 annunci gratuiti</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Cerca lavoro per te e i tuoi familiari</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Il 10% del tuo abbonamento andrà in beneficienza</span>
                          </li>
                          <li className="mt-3 pt-3 border-t border-gray-200">
                            <span className="font-bold text-blue-600">Da 0,49€/mese</span> dopo 3 mesi di prova gratuita
                          </li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-lg mt-6">
                      <strong>Passo 3:</strong> Inserisci email, password e completa la registrazione
                    </p>
                    <p className="text-lg">
                      <strong>Passo 4:</strong> Attiva la prova gratuita di 3 mesi (nessuna carta richiesta)
                    </p>
                    <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded mt-4">
                      <p className="text-sm font-semibold text-blue-900">
                        Riceverai un promemoria via email 7 giorni prima della scadenza della prova. Se non rinnovi, l'abbonamento termina automaticamente senza addebiti.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="privati">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-green-200">
                <Users className="w-10 h-10 text-green-600" />
                <h2 className="text-4xl font-bold text-gray-900">Guida per Utenti Privati</h2>
              </div>

              <div className="space-y-10">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Recensioni</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Le recensioni sono il cuore di TrovaFacile. Aiutano altri utenti a trovare i migliori servizi e premiano le aziende di qualità.
                        </p>
                        <div className="bg-red-50 border-2 border-red-400 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-red-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Regola Fondamentale
                          </h4>
                          <p className="text-red-700 font-semibold">
                            Puoi recensire la stessa azienda <strong>una sola volta all'anno</strong>. Questo garantisce recensioni fresche e autentiche.
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Come scrivere una recensione:</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Cerca l'azienda o il servizio che vuoi recensire</li>
                            <li>Clicca sulla scheda dell'azienda</li>
                            <li>Clicca su "Scrivi una Recensione"</li>
                            <li>Valuta 4 aspetti con stelle da 1 a 5:
                              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                                <li><strong>Qualità:</strong> qualità del prodotto o servizio</li>
                                <li><strong>Prezzo:</strong> rapporto con il prezzo pagato</li>
                                <li><strong>Esperienza/Servizio:</strong> esperienza complessiva e servizio ricevuto</li>
                                <li><strong>Voto Generale:</strong> valutazione complessiva</li>
                              </ul>
                            </li>
                            <li>Scrivi un commento dettagliato sulla tua esperienza</li>
                            <li><strong>Opzionale ma consigliato:</strong> Carica una prova (scontrino, fattura, foto) per ricevere 50 punti invece di 25</li>
                          </ol>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Punti e Badge
                          </h4>
                          <ul className="space-y-1 text-sm">
                            <li><strong>25 punti:</strong> per ogni recensione approvata</li>
                            <li><strong>50 punti:</strong> per recensioni con prova documentale + Badge "Verificata"</li>
                            <li>Le recensioni vengono verificate entro 7 giorni</li>
                            <li>Recensioni false = perdita punti e sospensione account</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-red-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Cosa NON fare
                          </h4>
                          <ul className="space-y-1 text-sm text-red-700">
                            <li>Non lasciare recensioni false o inventate</li>
                            <li>Non usare linguaggio offensivo o diffamatorio</li>
                            <li>Non recensire la stessa azienda più di una volta all'anno</li>
                            <li>Non chiedere/offrire compensi per recensioni positive</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Tag className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Annunci Gratuiti</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Pubblica fino a 20 annunci gratuiti per vendere, comprare, scambiare o regalare oggetti.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Tipi di annuncio:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="bg-blue-50 p-2 rounded text-center">🏷️ Vendita</div>
                            <div className="bg-purple-50 p-2 rounded text-center">🛒 Acquisto</div>
                            <div className="bg-orange-50 p-2 rounded text-center">🔄 Scambio</div>
                            <div className="bg-pink-50 p-2 rounded text-center">🎁 Regalo</div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Categorie disponibili:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>🚗 Veicoli</div>
                            <div>🏠 Immobili</div>
                            <div>📱 Elettronica</div>
                            <div>🛋️ Casa e Giardino</div>
                            <div>👗 Moda e Accessori</div>
                            <div>⚽ Sport e Hobby</div>
                            <div>🐕 Animali</div>
                            <div>🔧 Servizi</div>
                            <div>📚 Libri e Riviste</div>
                            <div>🎮 Videogiochi</div>
                            <div>👶 Infanzia</div>
                            <div>🎵 Strumenti Musicali</div>
                          </div>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Regole importanti:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>✅ Massimo 20 annunci attivi contemporaneamente</li>
                            <li>✅ Ogni annuncio dura 30 giorni (rinnovabili gratis)</li>
                            <li>✅ Guadagni 5 punti per ogni annuncio pubblicato</li>
                            <li>✅ Usa la messaggistica interna per le trattative</li>
                            <li>✅ Incontra sempre in luoghi pubblici per la consegna</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-red-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Prodotti VIETATI
                          </h4>
                          <ul className="grid grid-cols-2 gap-1 text-sm text-red-700">
                            <li>❌ Armi e munizioni</li>
                            <li>❌ Droga e sostanze</li>
                            <li>❌ Prodotti contraffatti</li>
                            <li>❌ Tabacco e sigarette</li>
                            <li>❌ Farmaci</li>
                            <li>❌ Documenti falsi</li>
                            <li>❌ Animali protetti</li>
                            <li>❌ Fuochi d'artificio</li>
                          </ul>
                          <p className="mt-2 text-xs font-semibold">
                            Violazione = Rimozione immediata + Sospensione account
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Briefcase className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Cerca Lavoro</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Crea profili di ricerca lavoro per te e fino a 4 membri della tua famiglia. Le aziende potranno trovarti e contattarti direttamente.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Come funziona:</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Vai nella sezione "Lavoro" o nel tuo Profilo</li>
                            <li>Clicca su "Crea Profilo Cerca Lavoro"</li>
                            <li>Seleziona per chi (te stesso o un membro della famiglia)</li>
                            <li>Inserisci:
                              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                                <li>Categoria di lavoro cercato</li>
                                <li>Titolo di studio</li>
                                <li>Anni di esperienza</li>
                                <li>Competenze specifiche</li>
                                <li>Zona di interesse</li>
                                <li>CV in PDF (opzionale ma consigliato)</li>
                              </ul>
                            </li>
                            <li>Pubblica il profilo - è visibile alle aziende</li>
                          </ol>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Rispondere agli annunci:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>• Cerca annunci di lavoro nella sezione "Lavoro"</li>
                            <li>• Filtra per categoria, città e livello di esperienza</li>
                            <li>• Clicca su "Candidati" per rispondere</li>
                            <li>• Le aziende riceveranno il tuo profilo e ti contatteranno</li>
                          </ul>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Privacy e Sicurezza
                          </h4>
                          <ul className="space-y-1 text-sm">
                            <li>✓ Il tuo cognome completo non è mai visibile pubblicamente</li>
                            <li>✓ Email e telefono visibili solo dopo che rispondi a un'offerta</li>
                            <li>✓ Puoi nascondere il profilo in qualsiasi momento</li>
                            <li>✓ Segnala immediatamente offerte sospette o truffaldine</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 border-l-4 border-pink-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Heart className="w-8 h-8 text-pink-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Sezione Solidarietà</h3>
                      <div className="space-y-3 text-gray-700">
                        <p className="text-lg">
                          Uno spazio sicuro dove persone in difficoltà possono chiedere aiuto e altri possono offrire supporto concreto.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-3 text-pink-700">Richiedere Aiuto</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Vai nella sezione "Solidarietà"</li>
                            <li>Clicca su "Richiedi Aiuto"</li>
                            <li>Seleziona il tipo di aiuto necessario:
                              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                                <li>🍎 Aiuto Alimentare</li>
                                <li>👕 Vestiario e Calzature</li>
                                <li>💊 Medicine e Cure Mediche</li>
                                <li>⚡ Bollette e Utenze</li>
                                <li>🏠 Affitto e Casa</li>
                                <li>📚 Materiale Scolastico</li>
                                <li>💼 Supporto al Lavoro</li>
                                <li>🛠️ Altro</li>
                              </ul>
                            </li>
                            <li>Descrivi la tua situazione in modo chiaro e onesto</li>
                            <li>Carica documenti che attestano la difficoltà:
                              <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                                <li>Certificato ISEE</li>
                                <li>Certificati medici</li>
                                <li>Documenti di disoccupazione</li>
                                <li>Bollette non pagate</li>
                              </ul>
                            </li>
                            <li>Scegli se rimanere anonimo o mostrare il tuo nome</li>
                            <li>Invia la richiesta - verrà verificata dallo staff entro 24-48 ore</li>
                          </ol>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-3 text-pink-700">Offrire Aiuto</h4>
                          <ul className="space-y-2 ml-2">
                            <li>• Esplora le richieste nella tua zona</li>
                            <li>• Filtra per tipo di aiuto che puoi offrire</li>
                            <li>• Leggi attentamente la richiesta e i documenti</li>
                            <li>• Contatta la persona tramite messaggistica interna</li>
                            <li>• Organizza la consegna dell'aiuto in modo sicuro</li>
                            <li>• Mantieni sempre rispetto e discrezione</li>
                          </ul>
                        </div>
                        <div className="bg-pink-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Perché è sicuro:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>✓ Tutte le richieste sono verificate dallo staff</li>
                            <li>✓ Documenti validati per autenticità</li>
                            <li>✓ Sistema di messaggistica protetto</li>
                            <li>✓ Possibilità di rimanere anonimi</li>
                            <li>✓ Zero commissioni - tutto è gratuito</li>
                            <li>✓ Segnalazione immediata di abusi</li>
                          </ul>
                        </div>
                        <div className="bg-gradient-to-r from-pink-100 to-red-100 p-4 rounded-lg border-2 border-pink-300">
                          <p className="text-center font-semibold text-pink-900">
                            La solidarietà è completamente gratuita. Non sono previste commissioni o costi nascosti. Aiutare è un gesto d'amore che non ha prezzo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <TrendingUp className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Sistema Punti e Classifica</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Guadagna punti per ogni attività sulla piattaforma e scala la classifica mensile per vincere premi e badge esclusivi.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-3">Come Guadagnare Punti:</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                              <span>📝 Pubblicare un annuncio</span>
                              <span className="font-bold text-yellow-700">+5 punti</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                              <span>📦 Inserire un prodotto</span>
                              <span className="font-bold text-blue-700">+10 punti</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                              <span>🏪 Segnalare un'attività mancante</span>
                              <span className="font-bold text-green-700">+20 punti</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                              <span>⭐ Recensione approvata (base)</span>
                              <span className="font-bold text-orange-700">+25 punti</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                              <span>⭐ Recensione con prova documentale</span>
                              <span className="font-bold text-red-700">+50 punti</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                              <span>👥 Presenta un amico (che si abbona)</span>
                              <span className="font-bold text-purple-700">+30 punti</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Award className="w-6 h-6" />
                            Badge e Premi
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">🥉</div>
                              <div className="font-bold">Bronzo</div>
                              <div className="text-xs text-gray-600">100+ punti</div>
                            </div>
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">🥈</div>
                              <div className="font-bold">Argento</div>
                              <div className="text-xs text-gray-600">500+ punti</div>
                            </div>
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">🥇</div>
                              <div className="font-bold">Oro</div>
                              <div className="text-xs text-gray-600">1000+ punti</div>
                            </div>
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">💎</div>
                              <div className="font-bold">Platino</div>
                              <div className="text-xs text-gray-600">2500+ punti</div>
                            </div>
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">👑</div>
                              <div className="font-bold">Leggenda</div>
                              <div className="text-xs text-gray-600">5000+ punti</div>
                            </div>
                            <div className="bg-white p-3 rounded text-center">
                              <div className="text-2xl mb-1">⭐</div>
                              <div className="font-bold">Top 10</div>
                              <div className="text-xs text-gray-600">Classifica mese</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 rounded-r">
                          <h4 className="font-bold mb-2">Regole della Classifica:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• La classifica si azzera ogni anno il 1° gennaio</li>
                            <li>• I badge e i premi restano permanentemente nel profilo</li>
                            <li>• Comportamenti scorretti = perdita di tutti i punti</li>
                            <li>• Recensioni false o spam comportano sospensione</li>
                            <li>• Classifica visibile nella sezione "Classifica"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-50 border-l-4 border-cyan-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-8 h-8 text-cyan-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Messaggistica</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Comunica in modo sicuro con altri utenti, aziende e persone interessate ai tuoi annunci.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Regole di sicurezza:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>✓ Non condividere informazioni bancarie o carte di credito</li>
                            <li>✓ Non inviare denaro a sconosciuti senza garanzie</li>
                            <li>✓ Incontra sempre in luoghi pubblici per scambi di persona</li>
                            <li>✓ Segnala immediatamente comportamenti sospetti</li>
                            <li>✓ Non cliccare su link esterni sospetti</li>
                            <li>✓ Mantieni le conversazioni professionali e rispettose</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="business">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-purple-200">
                <Building className="w-10 h-10 text-purple-600" />
                <h2 className="text-4xl font-bold text-gray-900">Guida per Aziende</h2>
              </div>

              <div className="space-y-10">
                <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-sm max-w-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-6 h-6 text-purple-600" />
                    <h4 className="font-bold text-xl">Account Business</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Rivendica e gestisci la tua azienda</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Gestisci più sedi e punti vendita</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Rispondi alle recensioni</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Pubblica annunci di lavoro illimitati</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Crea sconti e offerte esclusive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Il 10% del tuo abbonamento andrà in beneficienza</span>
                    </li>
                    <li className="mt-3 pt-3 border-t border-gray-200">
                      <span className="font-bold text-purple-600">Da 2,49€/mese + IVA</span> dopo 3 mesi di prova
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-8 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-7 h-7 text-purple-600" />
                    Rivendicare la Tua Azienda
                  </h3>
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg">
                      Prendi il controllo della scheda della tua azienda per gestire informazioni, rispondere a recensioni e pubblicare offerte di lavoro.
                    </p>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h4 className="font-bold mb-3 text-lg">Processo di Rivendicazione:</h4>
                      <ol className="list-decimal list-inside space-y-3 ml-2">
                        <li className="font-semibold">Registra un account Business
                          <p className="ml-6 mt-1 font-normal text-sm">Scegli "Account Business" durante la registrazione e completa l'iscrizione</p>
                        </li>
                        <li className="font-semibold">Cerca la tua azienda
                          <p className="ml-6 mt-1 font-normal text-sm">Usa la barra di ricerca per trovare la tua attività. Se non c'è, puoi aggiungerla</p>
                        </li>
                        <li className="font-semibold">Clicca su "Rivendica Questa Attività"
                          <p className="ml-6 mt-1 font-normal text-sm">Troverai il pulsante nella pagina dell'azienda</p>
                        </li>
                        <li className="font-semibold">Fornisci i documenti richiesti:
                          <ul className="ml-6 mt-2 space-y-1 text-sm font-normal list-disc list-inside">
                            <li><strong>Partita IVA:</strong> numero di 11 cifre</li>
                            <li><strong>Codice Fiscale:</strong> dell'azienda o del titolare</li>
                            <li><strong>Codice Univoco SDI:</strong> per fatturazione elettronica</li>
                            <li><strong>PEC:</strong> indirizzo di posta elettronica certificata</li>
                            <li><strong>Codice ATECO:</strong> classificazione attività economica</li>
                          </ul>
                        </li>
                        <li className="font-semibold">Attendi la verifica
                          <p className="ml-6 mt-1 font-normal text-sm">Il nostro team verificherà i documenti entro 24-48 ore lavorative</p>
                        </li>
                        <li className="font-semibold">Ricevi conferma via email
                          <p className="ml-6 mt-1 font-normal text-sm">Una volta approvata, potrai gestire completamente la tua azienda</p>
                        </li>
                      </ol>
                    </div>
                    <div className="bg-purple-100 border-l-4 border-purple-600 p-4 rounded-r">
                      <p className="text-sm font-semibold">
                        <strong>Azienda non presente?</strong> Puoi crearla direttamente durante il processo di rivendicazione fornendo tutti i dati necessari (nome, categoria, indirizzo, orari, ecc.)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Home className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestione Sedi</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Se la tua azienda ha più punti vendita, negozi o uffici, puoi gestirli tutti da un unico account.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Cosa puoi fare per ogni sede:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>✓ Impostare indirizzo e contatti specifici</li>
                            <li>✓ Configurare orari di apertura diversi</li>
                            <li>✓ Caricare foto e logo personalizzati</li>
                            <li>✓ Aggiungere descrizione e servizi offerti</li>
                            <li>✓ Visualizzare recensioni specifiche per ogni sede</li>
                            <li>✓ Creare sconti e offerte localizzate</li>
                            <li>✓ Gestire annunci di lavoro per sede</li>
                          </ul>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Costi per più sedi:</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span>1 sede</span>
                              <span className="font-bold">2,49€/mese + IVA</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span>2-3 sedi</span>
                              <span className="font-bold">4,49€/mese + IVA</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span>4-5 sedi</span>
                              <span className="font-bold">6,49€/mese + IVA</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span>6-10 sedi</span>
                              <span className="font-bold">9,49€/mese + IVA</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded">
                              <span>10+ sedi</span>
                              <span className="font-bold">Contattaci</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestione Recensioni</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Le recensioni sono fondamentali per la reputazione online. Gestiscile in modo professionale per costruire fiducia.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-3">Come rispondere alle recensioni:</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                            <li>Accedi alla Dashboard della tua azienda</li>
                            <li>Vai su "Recensioni"</li>
                            <li>Clicca su "Rispondi" sotto la recensione</li>
                            <li>Scrivi una risposta professionale e costruttiva</li>
                            <li>La tua risposta sarà visibile pubblicamente</li>
                          </ol>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Buone pratiche:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>✓ Rispondi sempre, anche (soprattutto) alle recensioni negative</li>
                            <li>✓ Ringrazia i clienti per le recensioni positive</li>
                            <li>✓ Offri soluzioni concrete per i problemi segnalati</li>
                            <li>✓ Mantieni un tono professionale e cortese</li>
                            <li>✓ Non essere mai difensivo o aggressivo</li>
                            <li>✓ Usa le recensioni per migliorare il servizio</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-red-800">Cosa NON fare:</h4>
                          <ul className="space-y-1 text-sm text-red-700">
                            <li>❌ Non minacciare o insultare i clienti</li>
                            <li>❌ Non chiedere di rimuovere recensioni negative</li>
                            <li>❌ Non offrire compensi per recensioni positive</li>
                            <li>❌ Non creare account falsi per recensirti</li>
                            <li>❌ Non rivelare informazioni private dei clienti</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Briefcase className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Annunci di Lavoro</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Pubblica offerte di lavoro gratuitamente e trova i candidati ideali per la tua azienda.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-3">Come pubblicare un annuncio:</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                            <li>Vai su Dashboard → Annunci di Lavoro</li>
                            <li>Clicca "Nuovo Annuncio"</li>
                            <li>Compila i campi:
                              <ul className="list-disc list-inside ml-6 mt-1">
                                <li>Titolo della posizione</li>
                                <li>Categoria professionale</li>
                                <li>Tipo di contratto (Tempo indeterminato, Determinato, Stage, ecc.)</li>
                                <li>Livello di esperienza richiesto</li>
                                <li>Titolo di studio minimo</li>
                                <li>Descrizione dettagliata</li>
                                <li>Requisiti e competenze</li>
                                <li>Sede di lavoro</li>
                                <li>Data di scadenza annuncio</li>
                              </ul>
                            </li>
                            <li>Pubblica l'annuncio - è immediatamente visibile</li>
                          </ol>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Vantaggi:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>✓ Pubblicazione completamente gratuita</li>
                            <li>✓ Numero illimitato di annunci</li>
                            <li>✓ Ricevi candidature tramite messaggistica interna</li>
                            <li>✓ Visualizza profili completi dei candidati</li>
                            <li>✓ Puoi anche cercare profili attivamente</li>
                            <li>✓ Analytics sulle visualizzazioni dell'annuncio</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl">
                  <div className="flex items-start gap-4">
                    <Gift className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Sconti e Offerte</h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Crea sconti esclusivi per gli utenti della piattaforma e attira nuovi clienti.
                        </p>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Come funziona:</h4>
                          <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                            <li>Crea uno sconto nella Dashboard</li>
                            <li>Specifica: percentuale, descrizione, validità, condizioni</li>
                            <li>Lo sconto appare sulla tua pagina aziendale</li>
                            <li>Gli utenti lo vedono e possono riscattarlo</li>
                            <li>L'utente presenta il codice QR in sede</li>
                            <li>Tu scansioni il QR per verificare e applicare lo sconto</li>
                          </ol>
                        </div>
                        <div className="bg-orange-100 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Vantaggi:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>✓ Attira nuovi clienti dalla piattaforma</li>
                            <li>✓ Traccia quanti sconti vengono riscattati</li>
                            <li>✓ Sistema antifrode con QR verificato</li>
                            <li>✓ Maggiore visibilità per la tua attività</li>
                            <li>✓ Fidelizza i clienti esistenti</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="regole">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-red-200">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <h2 className="text-4xl font-bold text-gray-900">Regole e Politiche</h2>
              </div>

              <div className="space-y-8">
                <div className="bg-red-50 border-2 border-red-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-7 h-7 text-red-600" />
                    Comportamenti Vietati
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-red-800">Account e Identità</h4>
                      <ul className="space-y-1 text-sm">
                        <li>❌ Creare account multipli</li>
                        <li>❌ Fingere di essere qualcun altro</li>
                        <li>❌ Usare bot o script automatici</li>
                        <li>❌ Vendere o cedere il proprio account</li>
                        <li>❌ Condividere credenziali di accesso</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-red-800">Contenuti</h4>
                      <ul className="space-y-1 text-sm">
                        <li>❌ Linguaggio offensivo, discriminatorio</li>
                        <li>❌ Contenuti violenti o espliciti</li>
                        <li>❌ Spam e pubblicità ingannevole</li>
                        <li>❌ Informazioni false o diffamatorie</li>
                        <li>❌ Violazione copyright altrui</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-red-800">Recensioni</h4>
                      <ul className="space-y-1 text-sm">
                        <li>❌ Recensioni false o inventate</li>
                        <li>❌ Vendere/comprare recensioni</li>
                        <li>❌ Recensire se stessi</li>
                        <li>❌ Recensioni su concorrenti</li>
                        <li>❌ Minacce o estorsioni</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-red-800">Transazioni</h4>
                      <ul className="space-y-1 text-sm">
                        <li>❌ Truffe e frodi</li>
                        <li>❌ Vendere prodotti vietati/illegali</li>
                        <li>❌ Evasione fiscale</li>
                        <li>❌ Riciclaggio di denaro</li>
                        <li>❌ Schemi piramidali</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 bg-red-100 border-l-4 border-red-600 p-4 rounded-r">
                    <p className="font-bold text-red-900">
                      Sanzioni: Rimozione contenuti, perdita punti, sospensione temporanea o permanente dell'account, segnalazione alle autorità per reati penali.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Moderazione e Segnalazioni</h3>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      TrovaFacile si impegna a mantenere un ambiente sicuro e rispettoso per tutti gli utenti.
                    </p>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Come segnalare contenuti inappropriati:</h4>
                      <ol className="list-decimal list-inside space-y-2 ml-2 text-sm">
                        <li>Clicca sul pulsante "Segnala" presente su recensioni, annunci e profili</li>
                        <li>Seleziona il motivo della segnalazione</li>
                        <li>Aggiungi dettagli opzionali</li>
                        <li>Invia - il nostro team esaminerà entro 24-48 ore</li>
                      </ol>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Garanzie:</h4>
                      <ul className="space-y-1 text-sm">
                        <li>✓ Le segnalazioni sono completamente anonime</li>
                        <li>✓ Vengono prese molto sul serio</li>
                        <li>✓ Risposta rapida del team di moderazione</li>
                        <li>✓ Zero tolleranza per abusi gravi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="legale">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-gray-300">
                <FileText className="w-10 h-10 text-gray-600" />
                <h2 className="text-4xl font-bold text-gray-900">Aspetti Legali</h2>
              </div>

              <div className="space-y-8">
                <div className="bg-white border-2 border-gray-200 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Termini e Condizioni</h3>
                  <div className="space-y-4 text-gray-700 text-sm">
                    <div>
                      <h4 className="font-bold mb-2">1. Oggetto del Servizio</h4>
                      <p>
                        TrovaFacile è una piattaforma digitale che offre servizi di marketplace, recensioni, annunci classificati e opportunità di lavoro sul territorio italiano.
                        L'utilizzo comporta l'accettazione integrale dei presenti Termini e Condizioni.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">2. Registrazione e Account</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Riservata a maggiorenni e persone giuridiche regolarmente costituite</li>
                        <li>Vietato creare account multipli</li>
                        <li>L'utente è responsabile della custodia delle credenziali</li>
                        <li>TrovaFacile può sospendere account che violano i termini</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">3. Limitazioni di Responsabilità</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>TrovaFacile agisce come intermediario</li>
                        <li>Non garantiamo accuratezza dei contenuti degli utenti</li>
                        <li>Non siamo responsabili per transazioni tra utenti</li>
                        <li>Non garantiamo disponibilità ininterrotta del servizio</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">4. Proprietà Intellettuale</h4>
                      <p>
                        Tutti i contenuti del sito (design, loghi, software) sono proprietà di TrovaFacile e protetti dalle leggi sul diritto d'autore.
                        Gli utenti mantengono la proprietà dei contenuti pubblicati ma concedono a TrovaFacile una licenza per utilizzarli nell'ambito del servizio.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">5. Legge Applicabile</h4>
                      <p>
                        I presenti Termini sono regolati dalla legge italiana. Per controversie è competente il Foro del luogo di residenza del consumatore,
                        ai sensi del D.Lgs. 206/2005 (Codice del Consumo).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy e GDPR</h3>
                  <div className="space-y-4 text-gray-700 text-sm">
                    <p className="text-base">
                      Ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR), forniamo le seguenti informazioni sul trattamento dei dati personali.
                    </p>
                    <div>
                      <h4 className="font-bold mb-2">Titolare del Trattamento</h4>
                      <p>TrovaFacile S.r.l. - Email: privacy@trovafacile.it</p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Dati Trattati</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Dati anagrafici: nome, cognome, data di nascita</li>
                        <li>Dati di contatto: email, telefono, indirizzo</li>
                        <li>Dati di navigazione: IP, browser, pagine visitate</li>
                        <li>Dati business: P.IVA, C.F., PEC, ATECO (solo aziende)</li>
                        <li>Contenuti: recensioni, annunci, messaggi, foto</li>
                        <li>Dati di pagamento: gestiti da Stripe (non conservati da noi)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Finalità del Trattamento</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Erogazione dei servizi della piattaforma</li>
                        <li>Gestione registrazione e autenticazione</li>
                        <li>Gestione abbonamenti e pagamenti</li>
                        <li>Verifica identità aziende</li>
                        <li>Moderazione contenuti</li>
                        <li>Assistenza clienti</li>
                        <li>Obblighi legali, contabili e fiscali</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Diritti dell'Interessato (artt. 15-22 GDPR)</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Accesso: ottenere copia dei dati trattati</li>
                        <li>Rettifica: correggere dati inesatti</li>
                        <li>Cancellazione: richiedere eliminazione dati</li>
                        <li>Limitazione: limitare il trattamento</li>
                        <li>Portabilità: ricevere dati in formato strutturato</li>
                        <li>Opposizione: opporsi al trattamento</li>
                        <li>Revoca consenso: in qualsiasi momento</li>
                      </ul>
                      <p className="mt-2">
                        Per esercitare i diritti: privacy@trovafacile.it
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Sicurezza</h4>
                      <p>
                        Adottiamo misure tecniche e organizzative per proteggere i dati da accessi non autorizzati, perdita o distruzione.
                        Le password sono crittografate. I dati sensibili sono conservati su server sicuri nell'UE.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border-2 border-orange-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Cookie Policy</h3>
                  <div className="space-y-4 text-gray-700 text-sm">
                    <p>
                      I cookie sono piccoli file di testo memorizzati sul dispositivo quando visiti un sito web.
                    </p>
                    <div>
                      <h4 className="font-bold mb-2">Cookie Utilizzati</h4>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded">
                          <p className="font-bold">Cookie Tecnici (Necessari)</p>
                          <p className="text-xs">Essenziali per il funzionamento. Non richiedono consenso.</p>
                          <ul className="text-xs list-disc list-inside ml-2 mt-1">
                            <li>Autenticazione e sessione</li>
                            <li>Preferenze linguistiche</li>
                            <li>Sicurezza</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="font-bold">Cookie Analitici</p>
                          <p className="text-xs">Raccolgono informazioni sull'utilizzo in forma aggregata. Richiedono consenso.</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="font-bold">Cookie di Marketing</p>
                          <p className="text-xs">Utilizzati per pubblicità personalizzata. Richiedono consenso esplicito.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Gestione Cookie</h4>
                      <p>
                        Puoi gestire i cookie dalle impostazioni del browser (Chrome: Impostazioni → Privacy → Cookie; Firefox: Opzioni → Privacy).
                        Disabilitare i cookie tecnici può compromettere alcune funzionalità del sito.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Diritto di Recesso</h3>
                  <div className="space-y-4 text-gray-700 text-sm">
                    <p>
                      Ai sensi degli artt. 52-59 del D.Lgs. 206/2005 (Codice del Consumo), hai diritto di recedere dall'abbonamento entro 14 giorni
                      dalla sottoscrizione senza dover fornire motivazioni.
                    </p>
                    <div>
                      <h4 className="font-bold mb-2">Come Esercitare il Diritto</h4>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Invia comunicazione a: recesso@trovafacile.it</li>
                        <li>Indica: nome, email, numero abbonamento, data sottoscrizione</li>
                        <li>Riceverai conferma entro 48 ore</li>
                        <li>Rimborso entro 14 giorni sulla stessa modalità di pagamento</li>
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Eccezioni</h4>
                      <p>
                        Ai sensi dell'art. 59, il diritto di recesso è escluso per servizi già completamente eseguiti con consenso espresso del consumatore.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Risoluzione Controversie</h3>
                  <div className="space-y-4 text-gray-700 text-sm">
                    <div>
                      <h4 className="font-bold mb-2">Contatti</h4>
                      <p>Per reclami o controversie:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Email: supporto@trovafacile.it</li>
                        <li>PEC: trovafacile@pec.it</li>
                        <li>Tempi di risposta: 7 giorni lavorativi</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Piattaforma ODR</h4>
                      <p>
                        Ai sensi del Regolamento UE 524/2013, i consumatori possono utilizzare la piattaforma europea per la risoluzione online delle controversie:
                        <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                          https://ec.europa.eu/consumers/odr
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Modifiche al Regolamento</h4>
                  <p className="text-sm text-gray-700">
                    TrovaFacile si riserva il diritto di modificare il presente regolamento in qualsiasi momento.
                    Le modifiche saranno comunicate via email e pubblicate su questa pagina.
                    L'utilizzo continuato dopo le modifiche costituisce accettazione.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Ultimo aggiornamento: 8 Febbraio 2026
                  </p>
                </div>
              </div>
            </section>

            <section id="faq">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-blue-200">
                <HelpCircle className="w-10 h-10 text-blue-600" />
                <h2 className="text-4xl font-bold text-gray-900">Domande Frequenti (FAQ)</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtra per categoria:
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-2">
                          {faq.category}
                        </span>
                        <h3 className="font-bold text-gray-900">{faq.question}</h3>
                      </div>
                      <div className="ml-4">
                        {expandedFAQ === index ? (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold">−</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600 font-bold">+</span>
                          </div>
                        )}
                      </div>
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-6 rounded-xl text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Non trovi la risposta che cerchi?</h3>
                <p className="text-gray-700 mb-4">
                  Il nostro team di supporto è sempre pronto ad aiutarti!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="/contact"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Contattaci
                  </a>
                  <a
                    href="mailto:supporto@trovafacile.it"
                    className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    Email: supporto@trovafacile.it
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
