import { Star, ShoppingBag, Briefcase, Search, Gift, Gavel, Users, CreditCard, Heart, Building2, AlertTriangle, Clock, TrendingUp, UserCheck, Activity } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    trialUsers: number;
    totalReviews: number;
    pendingReviews: number;
    totalAds: number;
    adsSell: number;
    adsBuy: number;
    adsGift: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    totalBusinesses: number;
    totalProducts: number;
    totalReports: number;
    pendingReports: number;
    totalJobPostings: number;
    totalJobSeekers: number;
    totalAuctions: number;
    registeredBusinesses: number;
    importedBusinesses: number;
    userAddedBusinesses: number;
    totalLocations: number;
    totalFamilyMembers: number;
    solidarityTotal: number;
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: { label: string; value: number | string; color: string };
  breakdown?: { label: string; value: number | string }[];
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, badge, breakdown }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.color}`}>
            {badge.value} {badge.label}
          </span>
        )}
      </div>
      <div className="mt-1">
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
        </p>
        <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {breakdown && breakdown.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
            {breakdown.map(b => (
              <span key={b.label} className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{typeof b.value === 'number' ? b.value.toLocaleString('it-IT') : b.value}</span> {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminStats({ stats }: AdminStatsProps) {
  const approvalRate = stats.totalReviews > 0
    ? Math.round(((stats.totalReviews - stats.pendingReviews) / stats.totalReviews) * 100)
    : 0;

  const solidarityFormatted = stats.solidarityTotal.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Panoramica Piattaforma</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <Activity className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Sistema Attivo</span>
        </div>
      </div>

      {/* Sezione: Utenti */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Utenti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utenti Iscritti"
            value={stats.totalUsers}
            subtitle="Esclusi amministratori"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            badge={stats.trialUsers > 0 ? { label: 'in prova', value: stats.trialUsers, color: 'bg-amber-100 text-amber-700' } : undefined}
          />
          <StatCard
            title="Utenti in Prova"
            value={stats.trialUsers}
            subtitle="Abbonamento trial attivo"
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Abbonamenti Attivi"
            value={stats.activeSubscriptions}
            subtitle="Business e privati"
            icon={CreditCard}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <StatCard
            title="Abbonamenti in Prova"
            value={stats.trialSubscriptions}
            subtitle="Trial attivi"
            icon={CreditCard}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
        </div>
      </section>

      {/* Sezione: Recensioni */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> Recensioni
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Recensioni"
            value={stats.totalReviews}
            subtitle="Tutte le recensioni"
            icon={Star}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
            badge={stats.pendingReviews > 0 ? { label: 'in attesa', value: stats.pendingReviews, color: 'bg-orange-100 text-orange-700' } : undefined}
            breakdown={[
              { label: 'approvate', value: stats.totalReviews - stats.pendingReviews },
              { label: 'in attesa', value: stats.pendingReviews },
            ]}
          />
        </div>
      </section>

      {/* Sezione: Lavoro */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Lavoro
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Trova Lavoro"
            value={stats.totalJobPostings}
            subtitle="Offerte pubblicate da aziende"
            icon={Briefcase}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
          />
          <StatCard
            title="Cerca Lavoro"
            value={stats.totalJobSeekers}
            subtitle="Profili candidati attivi"
            icon={Search}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
          />
        </div>
      </section>

      {/* Sezione: Annunci */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Annunci
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Annunci Vendita"
            value={stats.adsSell}
            subtitle="Tipo: Vendo"
            icon={ShoppingBag}
            iconBg="bg-pink-50"
            iconColor="text-pink-600"
          />
          <StatCard
            title="Annunci Cerco"
            value={stats.adsBuy}
            subtitle="Tipo: Cerco"
            icon={Search}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Annunci Regalo"
            value={stats.adsGift}
            subtitle="Tipo: Regalo"
            icon={Gift}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            title="Aste"
            value={stats.totalAuctions}
            subtitle="Tutte le aste"
            icon={Gavel}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>
      </section>

      {/* Sezione: Solidarietà */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4" /> Solidarietà
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Totale in Beneficienza"
            value={solidarityFormatted}
            subtitle="Cifra destinata alle organizzazioni"
            icon={Heart}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      </section>

      {/* Sezione: Moderazione */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Da Moderare
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Star className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Recensioni in Attesa</p>
                    <p className="text-xs text-gray-500">Richiedono approvazione</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Segnalazioni Aperte</p>
                    <p className="text-xs text-gray-500">Da verificare</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.pendingReports}</span>
              </div>
            </div>
          </div>

          {/* Metriche */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Metriche Chiave
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Tasso Approvazione Recensioni</span>
                  <span className="text-xs font-bold text-green-600">{approvalRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }} />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats.totalFamilyMembers}</p>
                  <p className="text-xs text-gray-500">Membri Famiglia</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-500">Prodotti</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stats.totalBusinesses}</p>
                  <p className="text-xs text-gray-500">Attivita'</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione: Attività */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Attivita' Commerciali
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Registrate"
            value={stats.registeredBusinesses}
            subtitle="Attivita' con account"
            icon={Building2}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Importate"
            value={stats.importedBusinesses}
            subtitle="Da fonti esterne"
            icon={Building2}
            iconBg="bg-gray-50"
            iconColor="text-gray-500"
          />
          <StatCard
            title="Sedi Totali"
            value={stats.totalLocations}
            subtitle="Sedi registrate"
            icon={UserCheck}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
        </div>
      </section>
    </div>
  );
}
