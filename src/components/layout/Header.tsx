import { useState, useEffect } from 'react';
import { User, Menu, X, Home, Phone, FileText, CreditCard, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import NotificationBell from '../notifications/NotificationBell';
import { ActiveProfileIndicator } from '../profile/ActiveProfileIndicator';

export function Header() {
  const { user, profile, selectedBusinessLocationId, businessLocations } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const selectedLocation = selectedBusinessLocationId
    ? businessLocations.find(loc => loc.id === selectedBusinessLocationId)
    : null;

  useEffect(() => {
    const selectedPlanId = localStorage.getItem('selectedPlanId');
    const urlParams = new URLSearchParams(window.location.search);
    const registerType = urlParams.get('register');
    const loginParam = urlParams.get('login');

    if (selectedPlanId && !user) {
      setAuthMode('register');
      setShowAuthModal(true);
    } else if (registerType && !user) {
      setAuthMode('register');
      setShowAuthModal(true);
    } else if (loginParam && !user) {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  }, [user]);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a href="/" className="flex items-center flex-shrink-0">
              <img
                src="/chatgpt_image_4_dic_2025,_22_51_45.png"
                alt="TrovaFacile"
                className="h-12"
              />
            </a>

            {user && profile ? (
              <>
                <nav className="hidden lg:flex items-center gap-3 ml-6">
                  <a
                    href="/"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title="Home"
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm">Home</span>
                  </a>
                  <a
                    href="/messages"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title="Messaggi"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Messaggi</span>
                  </a>
                  <NotificationBell />
                  <a
                    href="/contact"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title="Contatti"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Contatti</span>
                  </a>
                  <a
                    href="/subscription"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title="Abbonamenti"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Piani</span>
                  </a>
                  <a
                    href="/rules"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title="Regolamento"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Regole</span>
                  </a>
                </nav>

                <div className="flex-1"></div>

                <nav className="hidden lg:flex items-center gap-2">
                  <ActiveProfileIndicator />
                  {selectedLocation && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium border border-blue-300">
                      <span className="font-semibold">Sede:</span>
                      <span>{selectedLocation.internal_name || selectedLocation.city}</span>
                    </div>
                  )}
                  <a
                    href="/profile"
                    className="flex items-center gap-0.5 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                    title="Mio Profilo"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs">Profilo</span>
                  </a>
                </nav>
              </>
            ) : (
              <>
                <div className="flex-1"></div>
                <nav className="hidden lg:flex items-center gap-4">
                  <a
                    href="/contact"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Contatti</span>
                  </a>
                  <a
                    href="/subscription"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Piani</span>
                  </a>
                  <a
                    href="/rules"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Regole</span>
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-2"
                  >
                    Accedi
                  </button>
                </nav>
              </>
            )}

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-gray-700 hover:text-blue-600 ml-auto"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col gap-5">
                {user && profile ? (
                  <>
                    {selectedLocation && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-300">
                        <span className="font-semibold">Sede selezionata:</span>
                        <span>{selectedLocation.internal_name || selectedLocation.city}</span>
                      </div>
                    )}
                    <a
                      href="/"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </a>
                    <a
                      href="/messages"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Messaggi</span>
                    </a>
                    <a
                      href="/contact"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Phone className="w-5 h-5" />
                      <span>Contatti</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Abbonamenti</span>
                    </a>
                    <a
                      href="/rules"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="w-5 h-5" />
                      <span>Regolamento</span>
                    </a>
                    <a
                      href="/profile"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>{profile.full_name}</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/contact"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Phone className="w-5 h-5" />
                      <span>Contatti</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Abbonamenti</span>
                    </a>
                    <a
                      href="/rules"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="w-5 h-5" />
                      <span>Regolamento</span>
                    </a>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-left font-medium"
                    >
                      Accedi
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
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
                window.location.href = '/';
              }} />
            ) : (
              <RegisterForm onSuccess={() => {
                setShowAuthModal(false);
                const claimBusinessId = sessionStorage.getItem('claimBusinessId');
                if (claimBusinessId) {
                  window.location.href = '/dashboard';
                } else {
                  window.location.href = '/';
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
