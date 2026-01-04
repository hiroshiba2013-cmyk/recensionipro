import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DeleteAccountButtonProps {
  onAccountDeleted: () => void;
}

export function DeleteAccountButton({ onAccountDeleted }: DeleteAccountButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'ELIMINA IL MIO ACCOUNT') {
      setError('Testo di conferma non corretto');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        throw rpcError;
      }

      onAccountDeleted();
    } catch (err: any) {
      console.error('Errore durante l\'eliminazione dell\'account:', err);
      const errorMessage = err?.message || 'Errore durante l\'eliminazione dell\'account. Riprova più tardi.';
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  if (!showConfirmation) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-7 h-7 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Eliminazione Account</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Se desideri eliminare il tuo account, perderai tutti i tuoi dati in modo permanente e irreversibile.
        </p>
        <button
          onClick={() => setShowConfirmation(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          <Trash2 className="w-5 h-5" />
          Elimina Account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 border-2 border-red-500">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600" />
        <h2 className="text-2xl font-bold text-red-900">Conferma Eliminazione Account</h2>
      </div>

      <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-red-900 mb-3">ATTENZIONE: Questa azione è irreversibile!</h3>
        <p className="text-red-800 mb-3">
          Eliminando il tuo account, verranno rimossi permanentemente:
        </p>
        <ul className="list-disc list-inside space-y-2 text-red-800 ml-4">
          <li>Tutte le tue recensioni</li>
          <li>Tutti i tuoi annunci gratuiti</li>
          <li>I membri della tua famiglia collegati all'account</li>
          <li>Le tue richieste di lavoro</li>
          <li>I tuoi messaggi e conversazioni</li>
          <li>Il tuo punteggio e posizione in classifica</li>
          <li>I tuoi referral</li>
          <li>Se hai un'azienda: annunci di lavoro, sconti, sedi e recensioni ricevute</li>
          <li>I tuoi abbonamenti attivi</li>
        </ul>
        <p className="text-red-900 font-bold mt-4">
          Non sarà possibile recuperare questi dati una volta eliminato l'account.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Per confermare, scrivi esattamente: <span className="text-red-600">ELIMINA IL MIO ACCOUNT</span>
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            setError(null);
          }}
          placeholder="ELIMINA IL MIO ACCOUNT"
          className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-semibold"
          disabled={isDeleting}
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting || confirmText !== 'ELIMINA IL MIO ACCOUNT'}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Eliminazione in corso...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              Elimina Definitivamente
            </>
          )}
        </button>
        <button
          onClick={() => {
            setShowConfirmation(false);
            setConfirmText('');
            setError(null);
          }}
          disabled={isDeleting}
          className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
