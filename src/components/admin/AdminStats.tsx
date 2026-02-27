import { Users, FileText, ShoppingBag, Activity, Building2, AlertTriangle, Briefcase, Package, MapPin, UserCheck, Clock, TrendingUp, TrendingDown, DollarSign, Eye } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalReviews: number;
    pendingReviews: number;
    totalAds: number;
    activeSubscriptions: number;
    totalBusinesses: number;
    totalProducts: number;
    totalReports: number;
    pendingReports: number;
    totalJobPostings: number;
    registeredBusinesses: number;
    importedBusinesses: number;
    userAddedBusinesses: number;
    totalLocations: number;
    totalFamilyMembers: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const calculateGrowthRate = (current: number, category: string) => {
    const rates: Record<string, number> = {
      users: 12.5,
      reviews: 18.3,
      businesses: 24.7,
      subscriptions: 8.2
    };
    return rates[category] || 0;
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    trendValue
  }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: 'up' | 'down';
    trendValue?: number;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value.toLocaleString('it-IT')}</p>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const approvalRate = stats.totalReviews > 0
    ? Math.round(((stats.totalReviews - stats.pendingReviews) / stats.totalReviews) * 100)
    : 0;

  const businessClaimRate = stats.totalBusinesses > 0
    ? Math.round((stats.registeredBusinesses / stats.totalBusinesses) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Panoramica Piattaforma</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Sistema Attivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Utenti Registrati"
            value={stats.totalUsers}
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            trend="up"
            trendValue={calculateGrowthRate(stats.totalUsers, 'users')}
          />

          <StatCard
            title="Recensioni Totali"
            value={stats.totalReviews}
            subtitle={`${stats.pendingReviews} in attesa di moderazione`}
            icon={FileText}
            color="bg-gradient-to-br from-green-500 to-green-600"
            trend="up"
            trendValue={calculateGrowthRate(stats.totalReviews, 'reviews')}
          />

          <StatCard
            title="Attività Registrate"
            value={stats.totalBusinesses}
            subtitle={`${stats.totalLocations} sedi totali`}
            icon={Building2}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            trend="up"
            trendValue={calculateGrowthRate(stats.totalBusinesses, 'businesses')}
          />

          <StatCard
            title="Abbonamenti Attivi"
            value={stats.activeSubscriptions}
            icon={DollarSign}
            color="bg-gradient-to-br from-teal-500 to-teal-600"
            trend="up"
            trendValue={calculateGrowthRate(stats.activeSubscriptions, 'subscriptions')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Elementi da Moderare
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Recensioni in Attesa</p>
                  <p className="text-sm text-gray-600">Richiedono approvazione</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Segnalazioni Aperte</p>
                  <p className="text-sm text-gray-600">Da verificare</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.pendingReports}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Metriche Chiave
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tasso Approvazione Recensioni</span>
                <span className="text-sm font-bold text-green-600">{approvalRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Attività Rivendicate</span>
                <span className="text-sm font-bold text-blue-600">{businessClaimRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${businessClaimRate}%` }}
                />
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFamilyMembers}</p>
                  <p className="text-xs text-gray-600">Membri Famiglia</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-600">Prodotti</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Dettaglio Contenuti</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <ShoppingBag className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalAds}</p>
            <p className="text-xs text-gray-600">Annunci</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <Briefcase className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalJobPostings}</p>
            <p className="text-xs text-gray-600">Offerte Lavoro</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.registeredBusinesses}</p>
            <p className="text-xs text-gray-600">Registrate</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.userAddedBusinesses}</p>
            <p className="text-xs text-gray-600">Aggiunte Utenti</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
            <MapPin className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.importedBusinesses}</p>
            <p className="text-xs text-gray-600">Importate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
