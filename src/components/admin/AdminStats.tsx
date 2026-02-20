import { Users, FileText, ShoppingBag, Activity, Building2, AlertTriangle, Briefcase, Package, MapPin, UserCheck, Clock } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiche Generali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utenti Totali</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recensioni</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <FileText className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annunci</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAds}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abbonamenti Attivi</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
              <Activity className="w-12 h-12 text-teal-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Segnalazioni</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
                <p className="text-xs text-orange-600">{stats.pendingReports} in sospeso</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offerte Lavoro</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalJobPostings}</p>
              </div>
              <Briefcase className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prodotti</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-12 h-12 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Attività Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registrate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.registeredBusinesses}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Importate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.importedBusinesses}</p>
              </div>
              <Building2 className="w-12 h-12 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aggiunte Utenti</p>
                <p className="text-3xl font-bold text-gray-900">{stats.userAddedBusinesses}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sedi Totali</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLocations}</p>
              </div>
              <MapPin className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
