import { useState, useEffect } from 'react';
import { User, Menu, X, Home, Phone, FileText, CreditCard, MessageCircle, Heart, Building2, Shield, Tag, Briefcase, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import NotificationBell from '../notifications/NotificationBell';
import { ActiveProfileIndicator } from '../profile/ActiveProfileIndicator';

export function Header() {
  const { user, profile, selectedBusinessLocationId, businessLocations } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const selectedLocation = selectedBusinessLocationId
    ? businessLocations.find(loc => loc.id === selectedBusinessLocationId)
    : null;

  const userType = profile?.user_type || 'customer';

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
                    title={t('header.home')}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm">{t('header.home')}</span>
                  </a>
                  <a
                    href="/messages"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title={t('header.messages')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{t('header.messages')}</span>
                  </a>
                  <NotificationBell />
                  <a
                    href="/contact"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title={t('header.contacts')}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{t('header.contacts')}</span>
                  </a>
                  <a
                    href="/subscription"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title={t('header.subscription')}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">{t('header.plans')}</span>
                  </a>
                  <a
                    href="/rules"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                    title={t('header.rules')}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{t('header.rules')}</span>
                  </a>
                  {profile?.is_admin && (
                    <a
                      href="/admin"
                      className="flex items-center gap-1 text-purple-700 hover:text-purple-900 transition-colors font-medium px-2"
                      title="Admin"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Admin</span>
                    </a>
                  )}
                </nav>

                <div className="flex-1"></div>

                <nav className="hidden lg:flex items-center gap-2">
                  <ActiveProfileIndicator />
                  {selectedLocation && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium border border-blue-300">
                      <span className="font-semibold">{t('header.location')}:</span>
                      <span>{selectedLocation.internal_name || selectedLocation.city}</span>
                    </div>
                  )}
                  <a
                    href="/profile"
                    className="flex items-center gap-0.5 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                    title={t('header.myProfile')}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs">{t('header.profile')}</span>
                  </a>
                </nav>
              </>
            ) : (
              <>
                <div className="flex-1"></div>
                <nav className="hidden lg:flex items-center gap-4">
                  <a
                    href="/claim-business"
                    className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 transition-colors font-bold px-3 py-2 rounded-lg"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">Verifica Attività</span>
                  </a>
                  <a
                    href="/solidarity"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{t('header.solidarity')}</span>
                  </a>
                  <a
                    href="/contact"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{t('header.contacts')}</span>
                  </a>
                  <a
                    href="/subscription"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">{t('header.plans')}</span>
                  </a>
                  <a
                    href="/rules"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors font-medium px-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{t('header.rules')}</span>
                  </a>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-2"
                  >
                    {t('header.login')}
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
                        <span className="font-semibold">{t('header.selectedLocation')}:</span>
                        <span>{selectedLocation.internal_name || selectedLocation.city}</span>
                      </div>
                    )}
                    <a
                      href="/"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Home className="w-5 h-5" />
                      <span>{t('header.home')}</span>
                    </a>
                    <a
                      href="/messages"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{t('header.messages')}</span>
                    </a>
                    <a
                      href="/contact"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Phone className="w-5 h-5" />
                      <span>{t('header.contacts')}</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>{t('header.subscription')}</span>
                    </a>
                    <a
                      href="/rules"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="w-5 h-5" />
                      <span>{t('header.rules')}</span>
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
                      href="/claim-business"
                      className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-bold px-4 py-3 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Building2 className="w-5 h-5" />
                      <span>Verifica Attività</span>
                    </a>
                    <a
                      href="/solidarity"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Heart className="w-5 h-5" />
                      <span>{t('header.solidarity')}</span>
                    </a>
                    <a
                      href="/contact"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Phone className="w-5 h-5" />
                      <span>{t('header.contacts')}</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>{t('header.subscription')}</span>
                    </a>
                    <a
                      href="/rules"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FileText className="w-5 h-5" />
                      <span>{t('header.rules')}</span>
                    </a>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-left font-medium"
                    >
                      {t('header.login')}
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {user && profile && (
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 md:gap-8 py-3">
              {userType !== 'business' && (
                <a
                  href="/classified-ads"
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-green-50 transition-all group"
                >
                  <Tag className="w-7 h-7 md:w-8 md:h-8 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-green-600">Annunci</span>
                </a>
              )}
              <a
                href="/jobs"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all group"
              >
                <Briefcase className="w-7 h-7 md:w-8 md:h-8 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-purple-600">Lavoro</span>
              </a>
              <a
                href="/solidarity"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-pink-50 transition-all group"
              >
                <Heart className="w-7 h-7 md:w-8 md:h-8 text-pink-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-pink-600">Solidarietà</span>
              </a>
              <a
                href="/leaderboard"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-yellow-50 transition-all group"
              >
                <Award className="w-7 h-7 md:w-8 md:h-8 text-yellow-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-yellow-600">Classifica</span>
              </a>
            </div>
          </div>
        </div>
      )}

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
