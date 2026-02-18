# Sistema di Notifiche Automatiche

## Notifiche Implementate

Il sistema invia automaticamente notifiche agli utenti per i seguenti eventi:

### 1. Annuncio Classificato nei Preferiti
- **Trigger**: Quando un utente aggiunge un annuncio classificato ai preferiti
- **Destinatario**: Proprietario dell'annuncio
- **Tipo**: `ad_favorited`
- **Icona**: Cuore rosso ❤️
- **Messaggio**: "Il tuo annuncio '[titolo]' è stato aggiunto ai preferiti da [nome utente]"

### 2. Annuncio Lavoro nei Preferiti
- **Trigger**: Quando un utente aggiunge un annuncio "Cerco Lavoro" ai preferiti
- **Destinatario**: Proprietario dell'annuncio
- **Tipo**: `job_favorited`
- **Icona**: Valigetta blu 💼
- **Messaggio**: "Il tuo annuncio '[titolo]' è stato aggiunto ai preferiti da [nome utente]"

### 3. Attività nei Preferiti
- **Trigger**: Quando un utente aggiunge un'attività commerciale ai preferiti
- **Destinatario**: Proprietario dell'attività
- **Tipo**: `business_favorited`
- **Icona**: Negozio verde 🏪
- **Messaggio**: "La tua attività '[nome]' è stata aggiunta ai preferiti da [nome utente]"

### 4. Abbonamento in Scadenza
- **Trigger**: Controllo periodico automatico (7, 3 e 1 giorno prima della scadenza)
- **Destinatario**: Proprietario dell'attività con abbonamento attivo
- **Tipo**: `subscription_expiring`
- **Icona**: Carta di credito arancione 💳
- **Messaggio**: "Il tuo abbonamento per '[nome attività]' scadrà tra X giorni. Rinnova ora per non perdere i vantaggi!"

## Controlli Periodici

### Edge Function: check-subscription-expiration

Per attivare i controlli automatici delle scadenze abbonamenti, è necessario:

1. **Configurare un Cron Job** (consigliato per produzione):
   ```bash
   # Eseguire ogni giorno alle 9:00
   0 9 * * * curl -X POST https://[PROJECT_URL]/functions/v1/check-subscription-expiration \
     -H "Authorization: Bearer [ANON_KEY]"
   ```

2. **Manualmente via API**:
   ```bash
   curl -X POST https://[PROJECT_URL]/functions/v1/check-subscription-expiration \
     -H "Authorization: Bearer [ANON_KEY]"
   ```

3. **Da codice JavaScript**:
   ```typescript
   const response = await fetch(
     `${supabaseUrl}/functions/v1/check-subscription-expiration`,
     {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${supabaseAnonKey}`
       }
     }
   );
   ```

## Trigger del Database

I trigger sono configurati automaticamente per:

- **favorite_classified_ads**: Inserimento di un nuovo preferito annuncio
- **favorite_businesses**: Inserimento di un nuovo preferito attività/lavoro

Questi trigger si attivano immediatamente e creano le notifiche in tempo reale.

## Funzioni Database

### create_notification()
Funzione helper per creare notifiche:
```sql
SELECT create_notification(
  'user_id'::uuid,
  'notification_type',
  'Titolo Notifica',
  'Messaggio della notifica',
  '{"key": "value"}'::jsonb
);
```

### check_subscription_expiration()
Controlla tutti gli abbonamenti attivi e invia notifiche per quelli in scadenza:
```sql
SELECT check_subscription_expiration();
```

### notify_favorite_created()
Trigger function che gestisce le notifiche per i preferiti (business e job seekers)

### notify_ad_favorited()
Trigger function che gestisce le notifiche per gli annunci classificati nei preferiti

## Configurazione Consigliata

Per un sistema completamente automatico in produzione:

1. **Supabase Cron Jobs** (se disponibile nel piano):
   - Configurare un job che esegue `check_subscription_expiration()` ogni giorno

2. **Servizio Esterno** (alternativa):
   - Usare un servizio come Cron-job.org o EasyCron
   - Configurare una chiamata giornaliera all'edge function

3. **Monitoraggio**:
   - Controllare i log dell'edge function per verificare l'esecuzione
   - Verificare la tabella `notifications` per confermare la creazione delle notifiche

## Testare il Sistema

### Test Notifica Preferito
1. Accedi con un utente A
2. Crea un annuncio classificato o un annuncio cerco lavoro
3. Accedi con un utente B
4. Aggiungi l'annuncio ai preferiti
5. Torna all'utente A e controlla le notifiche

### Test Scadenza Abbonamento
1. Crea un abbonamento con `end_date` tra 7, 3 o 1 giorno
2. Esegui manualmente: `SELECT check_subscription_expiration();`
3. Controlla le notifiche dell'utente proprietario

## Struttura Dati Notifica

```typescript
{
  id: uuid,
  user_id: uuid,
  type: 'ad_favorited' | 'job_favorited' | 'business_favorited' | 'subscription_expiring',
  title: string,
  message: string,
  data: {
    // Dati specifici per tipo
    ad_id?: uuid,
    job_seeker_id?: uuid,
    business_id?: uuid,
    subscription_id?: uuid,
    favorited_by?: uuid,
    days_until_expiry?: number,
    url?: string  // Link per aprire l'entità
  },
  read: boolean,
  created_at: timestamp
}
```

## Note Importanti

- Le notifiche vengono create solo se l'utente che compie l'azione è diverso dal proprietario
- Per la scadenza abbonamento, viene inviata una sola notifica al giorno per evitare spam
- Tutte le notifiche includono un link (`data.url`) per navigare direttamente all'entità correlata
- Gli utenti possono segnare le notifiche come lette o eliminarle
