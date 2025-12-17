import { useEffect, useState } from 'react';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { JobsPage } from '../pages/JobsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { BusinessDetailPage } from '../pages/BusinessDetailPage';

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

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

  if (currentPath.startsWith('/business/')) {
    const businessId = currentPath.split('/')[2];
    if (businessId) {
      return <BusinessDetailPage businessId={businessId} />;
    }
  }

  return <HomePage />;
}
