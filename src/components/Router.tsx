import { useEffect, useState, createContext, useContext } from 'react';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { JobsPage } from '../pages/JobsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { BusinessDetailPage } from '../pages/BusinessDetailPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ClassifiedAdsPage } from '../pages/ClassifiedAdsPage';
import { ClassifiedAdDetailPage } from '../pages/ClassifiedAdDetailPage';
import { MessagesPage } from '../pages/MessagesPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SolidarityPage } from '../pages/SolidarityPage';
import { ContactPage } from '../pages/ContactPage';
import { RulesPage } from '../pages/RulesPage';
import { DiscountsPage } from '../pages/DiscountsPage';
import { ProfileSelectionPage } from '../pages/ProfileSelectionPage';
import { ClaimBusinessPage } from '../pages/ClaimBusinessPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminRegisterPage } from '../pages/AdminRegisterPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { useAuth } from '../contexts/AuthContext';

const RouterContext = createContext<{ params: Record<string, string> }>({ params: {} });

export function useParams() {
  return useContext(RouterContext).params;
}

export function useNavigate() {
  return (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
}

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [params, setParams] = useState<Record<string, string>>({});
  const { needsProfileSelection, loading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setCurrentPath(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!needsProfileSelection) return;
    if (currentPath === '/select-profile') return;

    const protectedPaths = ['/dashboard', '/profile', '/messages'];
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));

    if (isProtectedPath) {
      window.history.pushState({}, '', '/select-profile');
      setCurrentPath('/select-profile');
    }
  }, [needsProfileSelection, loading, currentPath]);

  if (currentPath === '/select-profile') {
    return <ProfileSelectionPage />;
  }

  if (currentPath === '/search') {
    return <SearchResultsPage />;
  }

  if (currentPath === '/dashboard') {
    return <DashboardPage />;
  }

  if (currentPath === '/subscription') {
    return <SubscriptionPage />;
  }

  if (currentPath === '/jobs') {
    return <JobsPage />;
  }

  if (currentPath === '/profile') {
    return <ProfilePage />;
  }

  if (currentPath === '/leaderboard') {
    return <LeaderboardPage />;
  }

  if (currentPath === '/products') {
    return (
      <RouterContext.Provider value={{ params: {} }}>
        <ProductsPage />
      </RouterContext.Provider>
    );
  }

  if (currentPath.startsWith('/products/')) {
    const slug = currentPath.split('/')[2];
    if (slug) {
      return (
        <RouterContext.Provider value={{ params: { slug } }}>
          <ProductDetailPage />
        </RouterContext.Provider>
      );
    }
  }

  if (currentPath === '/discounts') {
    return <DiscountsPage />;
  }

  if (currentPath === '/classified' || currentPath === '/classified-ads') {
    return <ClassifiedAdsPage />;
  }

  if (currentPath.startsWith('/classified/') || currentPath.startsWith('/classified-ads/')) {
    const adId = currentPath.replace('/classified/', '').replace('/classified-ads/', '');
    if (adId) {
      return <ClassifiedAdDetailPage />;
    }
  }

  if (currentPath === '/messages') {
    return <MessagesPage />;
  }

  if (currentPath === '/notifications') {
    return <NotificationsPage />;
  }

  if (currentPath === '/solidarity') {
    return <SolidarityPage />;
  }

  if (currentPath === '/contact' || currentPath === '/contatti') {
    return <ContactPage />;
  }

  if (currentPath === '/rules' || currentPath === '/regolamento') {
    return <RulesPage />;
  }

  if (currentPath === '/claim-business' || currentPath === '/rivendica-attivita') {
    return <ClaimBusinessPage />;
  }

  if (currentPath === '/admin') {
    return <AdminDashboardPage />;
  }

  if (currentPath === '/admin-secure-register-2024') {
    return <AdminRegisterPage />;
  }

  if (currentPath === '/admin-login') {
    return <AdminLoginPage />;
  }

  if (currentPath.startsWith('/business/')) {
    const businessId = currentPath.split('/')[2];
    if (businessId) {
      return <BusinessDetailPage businessId={businessId} />;
    }
  }

  return <HomePage />;
}
