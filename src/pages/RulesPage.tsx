import { Shield, FileText, AlertCircle, CheckCircle, Award, Tag, Briefcase, Building, Star } from 'lucide-react';

export function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Regolamento e Note Legali</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Guida completa all'utilizzo della piattaforma TrovaFacile
            </p>
          </div>

          <div className="p-8 space-y-12">
            <section id="note-legali">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-200">
                <FileText className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Note Legali e Privacy</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1. Informazioni Generali</h3>
                  <p className="mb-3">
                    TrovaFacile è una piattaforma digitale che collega cittadini e imprese sul territorio italiano,
                    facilitando la ricerca di servizi, prodotti e opportunità lavorative.
                  </p>
                  <p>
                    L'utilizzo della piattaforma comporta l'accettazione integrale del presente regolamento.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2. Privacy e Trattamento Dati</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>I dati personali vengono trattati in conformità al GDPR (Regolamento UE 2016/679)</li>
                    <li>I dati vengono utilizzati esclusivamente per fornire i servizi della piattaforma</li>
                    <li>Gli utenti hanno diritto di accesso, rettifica e cancellazione dei propri dati</li>
                    <li>I dati non vengono condivisi con terze parti senza consenso esplicito</li>
                    <li>Le password vengono crittografate e non sono mai visibili al personale</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. Cookie e Tecnologie di Tracciamento</h3>
                  <p className="mb-2">
                    Il sito utilizza cookie tecnici necessari al funzionamento della piattaforma.
                    Non vengono utilizzati cookie di profilazione o di terze parti senza consenso esplicito.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">4. Responsabilità</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>TrovaFacile funge da intermediario tra utenti e aziende</li>
                    <li>La piattaforma non è responsabile della qualità dei servizi offerti dalle aziende</li>
                    <li>Gli utenti sono responsabili della veridicità delle informazioni fornite</li>
                    <li>Contenuti diffamatori, offensivi o illegali verranno rimossi e potranno comportare la sospensione dell'account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">5. Proprietà Intellettuale</h3>
                  <p>
                    Tutti i contenuti del sito (testi, immagini, loghi) sono protetti da copyright.
                    È vietata la riproduzione senza autorizzazione scritta.
                  </p>
                </div>
              </div>
            </section>

            <section id="rivendicare-azienda">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-200">
                <Building className="w-8 h-8 text-green-600" />
                <h2 className="text-3xl font-bold text-gray-900">Come Rivendicare un'Azienda</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Procedura di Rivendicazione</h3>
                  <ol className="list-decimal list-inside space-y-3 ml-4">
                    <li className="font-semibold">Registrati come Account Business</li>
                    <li className="font-semibold">Cerca la tua azienda nel database</li>
                    <li className="font-semibold">Clicca su "Rivendica questa Azienda"</li>
                    <li className="font-semibold">Compila il form con i dati aziendali richiesti:
                      <ul className="list-disc list-inside ml-6 mt-2 font-normal">
                        <li>Partita IVA</li>
                        <li>Codice Fiscale</li>
                        <li>Codice Univoco SDI</li>
                        <li>PEC (Posta Elettronica Certificata)</li>
                        <li>Codice ATECO</li>
                      </ul>
                    </li>
                    <li className="font-semibold">Attendi la verifica (solitamente 24-48 ore)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                    Requisiti per la Rivendicazione
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Devi essere il legale rappresentante o avere delega scritta</li>
                    <li>L'azienda deve essere regolarmente iscritta alla Camera di Commercio</li>
                    <li>I documenti forniti devono essere validi e verificabili</li>
                    <li>Non è possibile rivendicare aziende già rivendicate da altri</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-400 p-6 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nota:</strong> Una volta rivendicata l'azienda, potrai gestire tutte le informazioni,
                    pubblicare annunci di lavoro, creare offerte speciali e rispondere alle recensioni.
                  </p>
                </div>
              </div>
            </section>

            <section id="regolamento-recensioni">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-yellow-200">
                <Star className="w-8 h-8 text-yellow-600" />
                <h2 className="text-3xl font-bold text-gray-900">Regolamento Recensioni</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Come Scrivere una Recensione</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Accedi con il tuo account cliente</li>
                    <li>Cerca l'azienda che vuoi recensire</li>
                    <li>Clicca su "Scrivi una Recensione"</li>
                    <li>Compila i campi richiesti con valutazioni dettagliate</li>
                    <li>Aggiungi foto o documenti come prova (opzionale ma consigliato)</li>
                    <li>Pubblica la recensione</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Criteri di Valutazione</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Qualità del Servizio</h4>
                      <p className="text-sm">Valuta la professionalità e competenza dell'azienda</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Rapporto Qualità/Prezzo</h4>
                      <p className="text-sm">Considera se il servizio vale il prezzo pagato</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Puntualità</h4>
                      <p className="text-sm">Rispetto delle tempistiche concordate</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Disponibilità</h4>
                      <p className="text-sm">Cortesia e reattività del personale</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Cosa è Consentito
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-green-700">
                    <li>Descrivere la tua esperienza personale in modo onesto</li>
                    <li>Fornire dettagli utili per altri utenti</li>
                    <li>Allegare foto che documentano il servizio ricevuto</li>
                    <li>Esprimere opinioni personali costruttive</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    Cosa NON è Consentito
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-red-700">
                    <li>Linguaggio offensivo, volgare o discriminatorio</li>
                    <li>Recensioni false o ingannevoli</li>
                    <li>Diffamazione o accuse infondate</li>
                    <li>Recensioni incentivate o pagate</li>
                    <li>Informazioni personali di terzi</li>
                    <li>Contenuti che violano la privacy</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Sistema di Verifica e Approvazione</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Le recensioni con prove documentali (foto, scontrini, documenti) ricevono un badge "Verificata"
                    e conferiscono più punti nella classifica.
                  </p>
                  <div className="bg-white border-2 border-blue-300 p-4 rounded-lg mb-3">
                    <p className="text-sm font-bold text-blue-900 mb-2">Tempi di Approvazione</p>
                    <p className="text-sm text-gray-700">
                      Tutte le recensioni vengono sottoposte a moderazione e saranno <strong>confermate o negate entro 7 giorni</strong>
                      dalla pubblicazione. Durante questo periodo la recensione sarà visibile ma contrassegnata come "In revisione".
                    </p>
                  </div>
                  <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-lg mb-3">
                    <p className="text-sm font-bold text-amber-900 mb-2">Assegnazione Punti</p>
                    <p className="text-sm text-gray-700">
                      <strong>Importante:</strong> Il punteggio delle recensioni verrà assegnato <strong>solo quando la recensione verrà approvata dallo staff</strong>.
                      Se una recensione viene rifiutata o rimossa per violazione del regolamento, non verranno assegnati punti.
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    Le aziende possono rispondere alle recensioni per fornire chiarimenti o risolvere problemi.
                  </p>
                </div>
              </div>
            </section>

            <section id="regolamento-annunci">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-200">
                <Tag className="w-8 h-8 text-purple-600" />
                <h2 className="text-3xl font-bold text-gray-900">Regolamento Annunci Gratuiti</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Tipologie di Annunci</h3>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-2">Vendo</h4>
                      <p className="text-sm">Oggetti usati o nuovi in vendita</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-2">Cerco</h4>
                      <p className="text-sm">Oggetti che stai cercando</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-2">Regalo</h4>
                      <p className="text-sm">Oggetti da regalare gratuitamente</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Categorie Principali</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Elettronica</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Arredamento</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Abbigliamento</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Sport</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Auto e Moto</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Casa e Giardino</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Servizi</div>
                    <div className="bg-gray-100 p-3 rounded text-center text-sm font-medium">Altro</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Regole per gli Annunci</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Gli annunci devono contenere descrizioni chiare e veritiere</li>
                    <li>Le foto devono essere reali e rappresentare l'oggetto in vendita</li>
                    <li>È vietata la vendita di prodotti illegali o contraffatti</li>
                    <li>Non sono ammessi annunci a sfondo sessuale o inappropriato</li>
                    <li>Gli annunci scadono dopo 30 giorni (possono essere rinnovati)</li>
                    <li>È consentito un massimo di 20 annunci attivi contemporaneamente</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Prodotti Vietati
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Armi, munizioni ed esplosivi</li>
                    <li>Prodotti contraffatti o piratati</li>
                    <li>Sostanze stupefacenti o farmaci</li>
                    <li>Documenti falsi o rubati</li>
                    <li>Animali vivi (consentito solo tramite categorie specifiche)</li>
                    <li>Prodotti pericolosi o non conformi alle normative</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Sistema di Messaggistica</h3>
                  <p className="mb-2">
                    Gli utenti interessati possono contattarti tramite il sistema di messaggistica interno.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                    <li>Non condividere informazioni personali pubblicamente</li>
                    <li>Incontra gli acquirenti in luoghi pubblici e sicuri</li>
                    <li>Diffida di richieste di pagamento anticipato da parte di sconosciuti</li>
                    <li>Segnala comportamenti sospetti allo staff</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="annunci-lavoro">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
                <Briefcase className="w-8 h-8 text-orange-600" />
                <h2 className="text-3xl font-bold text-gray-900">Annunci di Lavoro</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Per le Aziende</h3>
                  <p className="mb-3">
                    Le aziende registrate e verificate possono pubblicare annunci di lavoro gratuitamente.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Accedi al tuo profilo aziendale</li>
                    <li>Vai nella sezione "Annunci di Lavoro"</li>
                    <li>Clicca su "Pubblica Annuncio"</li>
                    <li>Compila tutti i campi richiesti</li>
                    <li>Pubblica l'annuncio</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Informazioni Richieste</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Titolo della posizione</li>
                    <li>Descrizione dettagliata del ruolo</li>
                    <li>Requisiti richiesti (titolo di studio, esperienza, competenze)</li>
                    <li>Tipo di contratto (tempo determinato, indeterminato, stage)</li>
                    <li>Orario di lavoro (full-time, part-time)</li>
                    <li>Range retributivo (opzionale ma consigliato)</li>
                    <li>Sede di lavoro</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Per i Candidati</h3>
                  <p className="mb-3">
                    Gli utenti registrati possono candidarsi agli annunci o pubblicare il proprio profilo come "Cerco Lavoro".
                  </p>
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 mb-2">Come Candidarsi:</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-sm">
                      <li>Completa il tuo profilo con tutte le informazioni</li>
                      <li>Cerca gli annunci di tuo interesse</li>
                      <li>Clicca su "Contatta"</li>
                      <li>L'azienda riceverà il tuo messaggio e potrà contattarti</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Profilo "Cerco Lavoro"</h3>
                  <p className="mb-2">
                    Puoi creare un profilo pubblico "Cerco Lavoro" che le aziende possono visualizzare e contattarti direttamente.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                    <li>Specifica la posizione che cerchi</li>
                    <li>Indica le tue competenze principali</li>
                    <li>Descrivi la tua esperienza e qualifiche nel testo dell'annuncio</li>
                    <li>Ricevi messaggi dalle aziende interessate</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-400 p-6 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Nota Importante:</strong> Non è mai richiesto alcun pagamento per candidarsi agli annunci.
                    Diffida di offerte sospette che richiedono denaro in anticipo.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-400 p-6 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Caricamento CV:</strong> Non è possibile caricare curriculum vitae sulla piattaforma.
                    Le competenze e l'esperienza devono essere descritte direttamente nel testo dell\'annuncio.
                    Eventuali documenti possono essere condivisi privatamente tramite la chat con le aziende interessate.
                  </p>
                </div>
              </div>
            </section>

            <section id="classifica-premi">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
                <Award className="w-8 h-8 text-amber-600" />
                <h2 className="text-3xl font-bold text-gray-900">Classifica e Sistema Premi</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Come Funziona la Classifica</h3>
                  <p className="mb-3">
                    Gli utenti guadagnano punti per ogni attività svolta sulla piattaforma.
                    Più sei attivo e contribuisci alla community, più punti accumuli.
                  </p>
                  <p className="text-sm text-blue-700 font-medium">
                    La classifica si aggiorna in tempo reale e premia gli utenti più attivi con vantaggi esclusivi.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Come Guadagnare Punti</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border-2 border-purple-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Annuncio Pubblicato</h4>
                        <span className="text-2xl font-bold text-purple-600">5 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Per ogni annuncio pubblicato</p>
                    </div>

                    <div className="bg-white border-2 border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Presenta un Amico</h4>
                        <span className="text-2xl font-bold text-yellow-600">30 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Quando l'amico si abbona alla piattaforma</p>
                    </div>

                    <div className="bg-white border-2 border-orange-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Azienda Rivendicata</h4>
                        <span className="text-2xl font-bold text-orange-600">50 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Bonus una tantum per rivendicazione verificata</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 mb-3 mt-6">Punti per Recensioni (in base alle stelle):</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-red-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recensione 1 Stella</h4>
                        <span className="text-2xl font-bold text-red-600">2 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Recensione con valutazione 1 stella</p>
                    </div>

                    <div className="bg-white border-2 border-orange-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recensione 2 Stelle</h4>
                        <span className="text-2xl font-bold text-orange-600">4 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Recensione con valutazione 2 stelle</p>
                    </div>

                    <div className="bg-white border-2 border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recensione 3 Stelle</h4>
                        <span className="text-2xl font-bold text-yellow-600">10 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Recensione con valutazione 3 stelle</p>
                    </div>

                    <div className="bg-white border-2 border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recensione 4 Stelle</h4>
                        <span className="text-2xl font-bold text-blue-600">25 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Recensione con valutazione 4 stelle</p>
                    </div>

                    <div className="bg-white border-2 border-green-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recensione 5 Stelle</h4>
                        <span className="text-2xl font-bold text-green-600">50 pt</span>
                      </div>
                      <p className="text-sm text-gray-600">Recensione con valutazione 5 stelle</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-600" />
                    Sistema "Presenta un Amico"
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Invita i tuoi amici a registrarsi su TrovaFacile e guadagna 30 punti quando si abbonano alla piattaforma usando il tuo nickname!
                  </p>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">Come Funziona:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-2">
                      <li>Condividi il tuo nickname con amici e familiari</li>
                      <li>Quando si registrano, devono inserire il tuo nickname nel campo "Ti presenta un amico?"</li>
                      <li>Ricevi automaticamente 30 punti quando l'amico effettua l'abbonamento alla piattaforma</li>
                      <li>Più amici inviti, più punti accumuli nella classifica!</li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-4">
                    <p className="text-sm font-bold text-amber-900 mb-2">Condizioni per l'Assegnazione dei Punti</p>
                    <p className="text-sm text-gray-700">
                      <strong>Importante:</strong> Il punteggio del "Porta un Amico" (30 punti) verrà assegnato <strong>solo quando l'amico portato effettuerà l'abbonamento</strong> alla piattaforma.
                      La semplice registrazione non è sufficiente per ricevere i punti.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <p className="text-sm text-gray-700">
                      <strong className="text-green-700">Consiglio:</strong> Il campo per inserire il nickname è ben visibile
                      nel form di registrazione con sfondo giallo-arancione. Ricorda ai tuoi amici di non dimenticare
                      di inserire il tuo nickname per farti guadagnare punti!
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Livelli e Premi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg">
                      <div className="bg-gray-400 text-white font-bold px-4 py-2 rounded">Bronze</div>
                      <div className="flex-1">
                        <p className="font-medium">0 - 100 punti</p>
                        <p className="text-sm text-gray-600">Utente base</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg">
                      <div className="bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded">Silver</div>
                      <div className="flex-1">
                        <p className="font-medium">101 - 500 punti</p>
                        <p className="text-sm text-gray-600">Badge speciale sul profilo</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                      <div className="bg-amber-400 text-white font-bold px-4 py-2 rounded">Gold</div>
                      <div className="flex-1">
                        <p className="font-medium">501 - 1500 punti</p>
                        <p className="text-sm text-gray-600">Badge Gold + Sconti esclusivi partner</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                      <div className="bg-blue-600 text-white font-bold px-4 py-2 rounded">Platinum</div>
                      <div className="flex-1">
                        <p className="font-medium">1501+ punti</p>
                        <p className="text-sm text-gray-600">Badge Platinum + Sconti premium + Priorità assistenza</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Premi Mensili</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Ogni mese i primi 10 utenti della classifica ricevono premi speciali:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li><strong>1° classificato:</strong> Buono acquisto 100€ + Badge Campione del Mese</li>
                    <li><strong>2° classificato:</strong> Buono acquisto 50€</li>
                    <li><strong>3° classificato:</strong> Buono acquisto 25€</li>
                    <li><strong>Top 10:</strong> Badge riconoscimento e vantaggi esclusivi</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Regole della Classifica</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>I punti vengono assegnati solo per attività legittime</li>
                    <li>I punti per le recensioni vengono assegnati solo dopo l'approvazione dello staff</li>
                    <li>I punti "Porta un Amico" vengono assegnati solo quando l'amico effettua l'abbonamento</li>
                    <li>Recensioni false o spam comportano la perdita di tutti i punti e la sospensione</li>
                    <li>La classifica viene azzerata ogni anno il 1° gennaio</li>
                    <li>I premi mensili vengono consegnati entro il 10 del mese successivo</li>
                    <li>È vietato l'uso di bot o sistemi automatici per guadagnare punti</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="eliminazione-account">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-red-200">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-gray-900">Eliminazione Account</h2>
              </div>

              <div className="space-y-6 text-gray-700">
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Come Eliminare il Tuo Account</h3>
                  <p className="mb-3">
                    Puoi eliminare il tuo account in qualsiasi momento dalla pagina del tuo profilo.
                    Questa azione è permanente e non può essere annullata.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Accedi al tuo account</li>
                    <li>Vai nella pagina "Profilo"</li>
                    <li>Scorri fino alla sezione "Zona Pericolosa" in fondo alla pagina</li>
                    <li>Clicca su "Elimina Account"</li>
                    <li>Leggi attentamente l'avviso e conferma digitando il testo richiesto</li>
                    <li>Clicca su "Elimina Definitivamente"</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    Cosa Viene Eliminato
                  </h3>
                  <p className="mb-3 font-semibold text-gray-900">
                    Eliminando il tuo account, tutti i seguenti dati verranno rimossi permanentemente:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Recensioni:</strong> Tutte le recensioni che hai scritto verranno eliminate</li>
                    <li><strong>Annunci Gratuiti:</strong> Tutti i tuoi annunci di vendita, cerco o regalo verranno rimossi</li>
                    <li><strong>Membri della Famiglia:</strong> Tutti i profili dei membri della famiglia collegati al tuo account</li>
                    <li><strong>Richieste di Lavoro:</strong> Le tue candidature e profili "Cerco Lavoro"</li>
                    <li><strong>Messaggi:</strong> Tutte le conversazioni e messaggi privati</li>
                    <li><strong>Punteggio e Classifica:</strong> Il tuo punteggio e posizione in classifica</li>
                    <li><strong>Referral:</strong> I dati relativi agli amici che hai presentato</li>
                    <li><strong>Notifiche:</strong> Tutte le notifiche e segnalazioni</li>
                  </ul>

                  <div className="mt-4 bg-white border-2 border-orange-400 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Se hai un Account Business:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>L'azienda e tutti i punti vendita</li>
                      <li>Gli annunci di lavoro pubblicati</li>
                      <li>Gli sconti e le promozioni create</li>
                      <li>Le recensioni ricevute dalla tua azienda</li>
                      <li>Gli abbonamenti attivi (senza rimborso)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    Avvertenze Importanti
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>L'eliminazione dell'account è <strong>permanente e irreversibile</strong></li>
                    <li>Non sarà possibile recuperare nessuno dei dati eliminati</li>
                    <li>Non sono previsti rimborsi per abbonamenti attivi</li>
                    <li>Dovrai creare un nuovo account se vorrai utilizzare nuovamente la piattaforma</li>
                    <li>Le recensioni eliminate non potranno essere ripristinate</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-400 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Alternative all'Eliminazione</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Se non sei sicuro di voler eliminare definitivamente il tuo account, considera queste alternative:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Puoi semplicemente non utilizzare più la piattaforma senza eliminare l'account</li>
                    <li>Puoi rimuovere le informazioni personali dal tuo profilo</li>
                    <li>Puoi cancellare singolarmente recensioni e annunci che non vuoi più mantenere</li>
                    <li>Puoi contattare il supporto per risolvere eventuali problemi</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="modifiche-regolamento" className="mt-12">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Modifiche al Regolamento</h3>
                <p className="text-sm text-gray-700">
                  TrovaFacile si riserva il diritto di modificare il presente regolamento in qualsiasi momento.
                  Le modifiche saranno comunicate via email agli utenti registrati e pubblicate in questa pagina.
                  L'utilizzo continuato della piattaforma dopo le modifiche costituisce accettazione delle stesse.
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>Ultimo aggiornamento:</strong> Dicembre 2025
                </p>
              </div>
            </section>

            <section id="contatti-supporto" className="mt-8">
              <div className="bg-blue-600 text-white p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Hai Bisogno di Aiuto?</h3>
                <p className="mb-4">
                  Per qualsiasi domanda o chiarimento sul regolamento, contatta il nostro team di supporto.
                </p>
                <a
                  href="/contact"
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                >
                  Contattaci
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
