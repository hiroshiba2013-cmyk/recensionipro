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
import { SolidarityPage } from '../pages/SolidarityPage';

const RouterContext = createContext<{ params: Record<string, string> }>({ params: {} });

export function useParams() {
  return useContext(RouterContext).params;
}

export function useNavigate() {
  return (path: string) => {
    window.history.pushState({}, '', path);
  };
}

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [params, setParams] = useState<Record<string, string>>({});

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

  if (currentPath === '/classified') {
    return <ClassifiedAdsPage />;
  }

  if (currentPath.startsWith('/classified/')) {
    const adId = currentPath.split('/')[2];
    if (adId) {
      return <ClassifiedAdDetailPage />;
    }
  }

  if (currentPath === '/messages') {
    return <MessagesPage />;
  }

  if (currentPath === '/solidarity') {
    return <SolidarityPage />;
  }

  if (currentPath.startsWith('/business/')) {
    const businessId = currentPath.split('/')[2];
    if (businessId) {
      return <BusinessDetailPage businessId={businessId} />;
    }
  }

  return <HomePage />;
}
