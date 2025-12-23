import { useState, useEffect } from 'react';
import { LogOut, User, CreditCard, Briefcase, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const selectedPlanId = localStorage.getItem('selectedPlanId');
    const urlParams = new URLSearchParams(window.location.search);
    const registerType = urlParams.get('register');

    if (selectedPlanId && !user) {
      setAuthMode('register');
      setShowAuthModal(true);
    } else if (registerType === 'business' && !user) {
      setAuthMode('register');
      setShowAuthModal(true);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <img
                src="/chatgpt_image_4_dic_2025,_22_51_45.png"
                alt="TrovaFacile"
                className="h-12"
              />
            </a>

            <nav className="flex items-center gap-6">
              <a
                href="/jobs"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                <Briefcase className="w-5 h-5" />
                <span>Lavoro</span>
              </a>
              <a
                href="/leaderboard"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                <Trophy className="w-5 h-5" />
                <span>Classifica</span>
              </a>

              {user && profile ? (
                <>
                  <a
                    href="/subscription"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                    title="Abbonamenti"
                  >
                    <CreditCard className="w-5 h-5" />
                  </a>
                  <div className="flex items-center gap-3">
                    <a
                      href="/profile"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      title="Mio Profilo"
                    >
                      <User className="w-5 h-5" />
                      <span>{profile.full_name}</span>
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-700 hover:text-red-600 transition-colors"
                      title="Esci"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="/subscription"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Abbonamenti</span>
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accedi
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {authMode === 'login' ? 'Accedi' : 'Registrati'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {authMode === 'login' ? (
              <LoginForm onSuccess={() => {
                setShowAuthModal(false);
                window.location.href = '/profile';
              }} />
            ) : (
              <RegisterForm onSuccess={() => {
                setShowAuthModal(false);
                const claimBusinessId = sessionStorage.getItem('claimBusinessId');
                if (claimBusinessId) {
                  window.location.href = '/dashboard';
                } else {
                  window.location.href = '/profile';
                }
              }} />
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-700"
              >
                {authMode === 'login'
                  ? 'Non hai un account? Registrati'
                  : 'Hai già un account? Accedi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
