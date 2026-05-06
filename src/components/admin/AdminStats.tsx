import { Star, ShoppingBag, Briefcase, Search, Gift, Gavel, Users, CreditCard, Heart, Building2, AlertTriangle, Clock, TrendingUp, UserCheck, Activity, Calendar } from 'lucide-react';

const PERIOD_OPTIONS: { label: string; days: number | null }[] = [
  { label: 'Tutti', days: null },
  { label: 'Oggi', days: 1 },
  { label: '7 giorni', days: 7 },
  { label: '15 giorni', days: 15 },
  { label: '30 giorni', days: 30 },
  { label: '90 giorni', days: 90 },
  { label: '180 giorni', days: 180 },
];

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
  period: number | null;
  onPeriodChange: (days: number | null) => void;
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

export function AdminStats({ stats, period, onPeriodChange }: AdminStatsProps) {
  const approvalRate = stats.totalReviews > 0
    ? Math.round(((stats.totalReviews - stats.pendingReviews) / stats.totalReviews) * 100)
    : 0;

  const solidarityFormatted = stats.solidarityTotal.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const activePeriodLabel = PERIOD_OPTIONS.find(o => o.days === period)?.label ?? 'Tutti';

  return (
    <div className="space-y-8">

      {/* Header + filtro periodo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panoramica Piattaforma</h2>
          {period !== null && (
            <p className="text-sm text-gray-500 mt-0.5">
              Dati di attivita' per gli ultimi {period === 1 ? 'giorno' : `${period} giorni`}
              {' '}— abbonamenti e moderazione sono sempre aggiornati al momento attuale
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Periodo:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => onPeriodChange(days)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === days
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Sistema Attivo</span>
          </div>
        </div>
      </div>

      {/* Banner periodo attivo */}
      {period !== null && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Stai visualizzando l'attivita' degli <strong>ultimi {period === 1 ? 'giorno' : `${period} giorni`}</strong> ({activePeriodLabel}). I contatori di abbonamenti attivi, utenti in prova e elementi in moderazione riflettono sempre lo stato attuale.</span>
        </div>
      )}

      {/* Sezione: Utenti */}
      <section>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Utenti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utenti Iscritti"
            value={stats.totalUsers}
            subtitle={period !== null ? `Registrati negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Esclusi amministratori'}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Utenti in Prova"
            value={stats.trialUsers}
            subtitle="Stato attuale"
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Abbonamenti Attivi"
            value={stats.activeSubscriptions}
            subtitle="Stato attuale — business e privati"
            icon={CreditCard}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <StatCard
            title="Abbonamenti in Prova"
            value={stats.trialSubscriptions}
            subtitle="Stato attuale"
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
            subtitle={period !== null ? `Pubblicate negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Totale storico'}
            icon={Star}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
            badge={stats.pendingReviews > 0 ? { label: 'in attesa', value: stats.pendingReviews, color: 'bg-orange-100 text-orange-700' } : undefined}
            breakdown={[
              { label: 'approvate', value: stats.totalReviews - stats.pendingReviews },
              { label: 'in attesa (totale)', value: stats.pendingReviews },
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
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Offerte pubblicate da aziende'}
            icon={Briefcase}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
          />
          <StatCard
            title="Cerca Lavoro"
            value={stats.totalJobSeekers}
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Profili candidati attivi'}
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
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Tipo: Vendo'}
            icon={ShoppingBag}
            iconBg="bg-pink-50"
            iconColor="text-pink-600"
          />
          <StatCard
            title="Annunci Cerco"
            value={stats.adsBuy}
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Tipo: Cerco'}
            icon={Search}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Annunci Regalo"
            value={stats.adsGift}
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Tipo: Regalo'}
            icon={Gift}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            title="Aste"
            value={stats.totalAuctions}
            subtitle={period !== null ? `Negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Tutte le aste'}
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
            subtitle={period !== null ? `Documenti negli ultimi ${period === 1 ? 'giorno' : `${period} giorni`}` : 'Cifra totale destinata alle organizzazioni'}
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
