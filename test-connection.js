import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lrqeojukjpjllnvsjtor.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'REPLACE_WITH_ANON_KEY_FROM_SUPABASE_DASHBOARD';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Test connessione a Supabase...\n');

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Connessione riuscita!');
        console.log('📋 La tabella "tasks" esiste ed è vuota.\n');
        console.log('💡 Per vedere i dati, devi prima:');
        console.log('   1. Registrare un utente');
        console.log('   2. Fare login');
        console.log('   3. Inserire dei tasks');
      } else {
        console.error('❌ Errore:', error.message);
      }
      return;
    }

    console.log('✅ Connessione riuscita!');
    console.log(`📋 Trovati ${data.length} tasks:\n`);

    if (data.length === 0) {
      console.log('   Nessun task trovato. La tabella è vuota.\n');
      console.log('💡 Per aggiungere dati, devi prima autenticarti.');
    } else {
      console.log(data);
    }

  } catch (err) {
    console.error('❌ Errore di connessione:', err.message);
  }
}

testConnection();
