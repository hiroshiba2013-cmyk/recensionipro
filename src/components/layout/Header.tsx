import { useState, useEffect } from 'react';
import { User, Briefcase, Trophy, Package, MessageCircle, Tag, Heart, Menu, X, Home, Phone, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';

export function Header() {
  const { user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <img
                src="/chatgpt_image_4_dic_2025,_22_51_45.png"
                alt="TrovaFacile"
                className="h-12"
              />
            </a>

            <nav className="hidden lg:flex items-center gap-4">
              {user && profile ? (
                <>
                  <a
                    href="/"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                    title="Home"
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-sm">Home</span>
                  </a>
                  <a
                    href="/solidarity"
                    className="text-gray-700 hover:text-green-600 transition-colors"
                    title="Solidarietà"
                  >
                    <Heart className="w-5 h-5" />
                  </a>
                  <a
                    href="/products"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Prodotti"
                  >
                    <Package className="w-5 h-5" />
                  </a>
                  <a
                    href="/classified"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Annunci"
                  >
                    <Tag className="w-5 h-5" />
                  </a>
                  <a
                    href="/jobs"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Lavoro"
                  >
                    <Briefcase className="w-5 h-5" />
                  </a>
                  <a
                    href="/leaderboard"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Classifica"
                  >
                    <Trophy className="w-5 h-5" />
                  </a>
                  <a
                    href="/messages"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Messaggi"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a
                    href="/contact"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Contatti"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <a
                    href="/rules"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title="Regolamento"
                  >
                    <FileText className="w-5 h-5" />
                  </a>
                  <a
                    href="/profile"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium ml-2"
                    title="Mio Profilo"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm">{profile.full_name}</span>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/solidarity"
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Solidarietà</span>
                  </a>
                  <a
                    href="/contact"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Contatti</span>
                  </a>
                  <a
                    href="/rules"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Regolamento</span>
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

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-gray-700 hover:text-blue-600"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col gap-5">
                {user && profile ? (
                  <>
                    <a
                      href="/"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </a>
                    <a
                      href="/solidarity"
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Heart className="w-5 h-5" />
                      <span>Solidarietà</span>
                    </a>
                    <a
                      href="/products"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Package className="w-5 h-5" />
                      <span>Prodotti</span>
                    </a>
                    <a
                      href="/classified"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Tag className="w-5 h-5" />
                      <span>Annunci</span>
                    </a>
                    <a
                      href="/jobs"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Briefcase className="w-5 h-5" />
                      <span>Lavoro</span>
                    </a>
                    <a
                      href="/leaderboard"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Trophy className="w-5 h-5" />
                      <span>Classifica</span>
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
                      href="/solidarity"
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Heart className="w-5 h-5" />
                      <span>Solidarietà</span>
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
