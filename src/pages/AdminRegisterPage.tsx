import { useState } from 'react';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminRegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    adminKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const ADMIN_SECRET_KEY = 'ADMIN_2024_SECRET_KEY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri');
      setLoading(false);
      return;
    }

    if (formData.adminKey !== ADMIN_SECRET_KEY) {
      setError('Chiave admin non valida');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Errore durante la creazione dell\'account');
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        user_type: 'customer',
        is_admin: true,
        subscription_status: 'none',
      });

      if (profileError) throw profileError;

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registrazione Completata!</h2>
          <p className="text-gray-600">Il tuo account admin è stato creato con successo.</p>
          <p className="text-sm text-gray-500 mt-2">Verrai reindirizzato alla dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Registrazione Admin</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Area Riservata</p>
              <p>Questa pagina è destinata esclusivamente agli amministratori della piattaforma.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Conferma Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
              Chiave Admin
            </label>
            <input
              id="adminKey"
              type="password"
              value={formData.adminKey}
              onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
              required
              placeholder="Inserisci la chiave admin"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Richiedi la chiave admin al responsabile della piattaforma
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Registrazione in corso...' : 'Registra Admin'}
          </button>

          <div className="text-center pt-4">
            <a
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Hai già un account admin? Accedi
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
