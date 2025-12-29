# TrovaFacile - Piattaforma di Recensioni e Servizi Locali

Piattaforma italiana che connette attività locali con clienti, offrendo recensioni, sconti, annunci e opportunità di lavoro.

## Caratteristiche Principali

### Per gli Utenti Privati
- 📝 Scrivi recensioni dettagliate con foto e valutazioni multiple
- 💰 Accedi a sconti esclusivi delle attività locali
- 🎯 Sistema di punti e ricompense per l'attività sulla piattaforma
- 👨‍👩‍👧‍👦 Gestione profilo famiglia con membri multipli
- 💼 Pubblica annunci di ricerca lavoro e annunci solidali
- 🛍️ Marketplace con annunci classificati (vendi, compra, regala)
- **3 mesi di prova gratuita** per tutti i nuovi utenti

### Per le Attività Business
- 🏢 Profilo aziendale completo con sedi multiple
- ⭐ Gestione recensioni e risposta ai clienti
- 🎁 Creazione sconti e promozioni personalizzate
- 💼 Pubblicazione offerte di lavoro con filtri avanzati
- 📊 Statistiche dettagliate su visualizzazioni e performance
- 📧 **Sistema di notifica automatica** per attività non rivendicate
- **3 mesi di prova gratuita** al momento della registrazione

### Sistema di Abbonamenti
- **Utenti Privati**: da 0,99€/mese per 1 persona
- **Business**: da 2,49€/mese + IVA per 1 sede
- **Trial di 90 giorni gratuiti** per tutti
- Promemoria automatico 7 giorni prima della scadenza

## Database

Il sistema include:
- **29.018+ attività** importate da OpenStreetMap
- **230+ categorie business** complete con codici ATECO
- **117 categorie** per annunci classificati
- Copertura su tutto il territorio italiano

## Scripts Disponibili

### Sviluppo
```bash
npm run dev          # Avvia il server di sviluppo
npm run build        # Build per produzione
npm run preview      # Preview build di produzione
npm run typecheck    # Controllo tipi TypeScript
```

### Importazione Dati
```bash
npm run import:osm           # Importa da Overpass API
npm run import:geofabrik     # Importa da file PBF Geofabrik
npm run import:all-regions   # Importa tutte le regioni italiane
npm run import:provinces     # Importa per province
npm run import:by-city       # Importa per città principali
```

### Notifiche Email
```bash
npm run check:emails         # Verifica attività con email
npm run notify:businesses    # Invia notifiche a 100 attività (test)
npm run notify:all          # Invia notifiche a TUTTE le attività
```

### Monitoraggio
```bash
npm run progress    # Mostra progresso importazione
npm run monitor     # Monitora importazione in tempo reale
npm run status      # Stato generale del database
```

## Documentazione

- **[GUIDA_NOTIFICA_ATTIVITA.md](GUIDA_NOTIFICA_ATTIVITA.md)** - Guida completa al sistema di notifica email
- **[NOTIFICA_EMAIL_ATTIVITA.md](NOTIFICA_EMAIL_ATTIVITA.md)** - Quick start notifiche email
- **[GUIDA_IMPORTAZIONE_OSM.md](GUIDA_IMPORTAZIONE_OSM.md)** - Importazione dati OpenStreetMap
- **[GUIDA_GEOFABRIK.md](GUIDA_GEOFABRIK.md)** - Importazione da file Geofabrik
- **[IMPORT_OSM.md](IMPORT_OSM.md)** - Processo di importazione dettagliato

## Edge Functions Supabase

### Attive
1. **import-businesses-osm** - Importazione automatica da OpenStreetMap
2. **import-businesses-google** - Importazione da Google Places (se configurato)
3. **send-trial-reminders** - Invio promemoria scadenza trial
4. **notify-unclaimed-businesses** - Notifica email attività non rivendicate

## Tecnologie Utilizzate

### Frontend
- **React 18** con TypeScript
- **Vite** per build e sviluppo
- **Tailwind CSS** per lo styling
- **Lucide React** per le icone

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Row Level Security (RLS)** per la sicurezza
- Funzioni database per operazioni complesse

### Integrazioni
- **OpenStreetMap** via Overpass API
- Sistema di importazione dati automatico
- Edge Functions per operazioni server-side

## Setup Iniziale

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Configura le variabili d'ambiente nel file `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Struttura Database

### Tabelle Principali
- `profiles` - Profili utenti (privati e business)
- `businesses` - Attività business rivendicate
- `unclaimed_business_locations` - Attività non ancora rivendicate
- `business_locations` - Sedi fisiche delle attività
- `business_categories` - Categorie business con codici ATECO
- `reviews` - Recensioni con valutazioni multiple
- `discounts` - Sconti e promozioni
- `job_postings` - Offerte di lavoro
- `job_seekers` - Annunci di ricerca lavoro
- `classified_ads` - Annunci classificati
- `subscriptions` - Abbonamenti utenti
- `subscription_plans` - Piani abbonamento disponibili

### Sistema Punti
- `user_activity` - Attività utenti
- `rewards` - Premi disponibili
- `user_rewards` - Premi riscattati

## Sicurezza

Tutte le tabelle utilizzano **Row Level Security (RLS)**:
- Gli utenti possono vedere solo i propri dati
- Le policy sono restrittive per impostazione predefinita
- Autenticazione richiesta per operazioni sensibili
- Validazione dei permessi a livello database

## Sistema Trial

Entrambi i tipi di utenti (privati e business) ottengono:
- **90 giorni di prova gratuita** alla registrazione
- Nessuna carta di credito richiesta inizialmente
- Email di promemoria 7 giorni prima della scadenza
- Possibilità di aggiungere il pagamento in qualsiasi momento
- Addebito automatico solo alla fine del trial

## Notifiche Email Attività

Sistema per informare le attività non rivendicate:
- Email automatiche con design professionale
- Link diretto per rivendicare l'attività
- Informazioni sui benefici della piattaforma
- Offerta di 3 mesi gratuiti in evidenza
- Gestione lotti per evitare spam

Per maggiori dettagli: [NOTIFICA_EMAIL_ATTIVITA.md](NOTIFICA_EMAIL_ATTIVITA.md)

## Contribuire

Il progetto è in sviluppo attivo. Per contribuire:
1. Fork del repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push e creazione Pull Request

## Licenza

Tutti i diritti riservati.

## Contatti

Per domande o supporto, contattaci attraverso la piattaforma.

---

**TrovaFacile** - Connettere attività locali e clienti in tutta Italia 🇮🇹
