import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Store, User, Percent, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessLocation {
  id: string;
  business_name: string;
  address: string;
  city: string;
}

interface DiscountVerificationProps {
  businessId: string;
}

export function DiscountVerification({ businessId }: DiscountVerificationProps) {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      discount_title: string;
      discount_percentage: number;
      customer_name: string;
      confirmed_at: string;
    };
  } | null>(null);
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);

  useEffect(() => {
    loadLocations();
    loadRecentRedemptions();
  }, [businessId]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select('id, business_name, address, city')
        .eq('business_id', businessId)
        .order('business_name');

      if (error) throw error;
      if (data) {
        setLocations(data);
        if (data.length === 1) {
          setSelectedLocation(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadRecentRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_redemptions')
        .select(`
          id,
          redemption_code,
          status,
          confirmed_at,
          customer:profiles!customer_id(full_name),
          discount:discounts!discount_id(title, discount_percentage),
          location:business_locations!confirmed_by_location_id(business_name)
        `)
        .eq('discounts.business_id', businessId)
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setRecentRedemptions(data);
    } catch (error) {
      console.error('Error loading recent redemptions:', error);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      setResult({
        success: false,
        message: 'Seleziona una sede'
      });
      return;
    }

    if (!redemptionCode || redemptionCode.length !== 6) {
      setResult({
        success: false,
        message: 'Il codice deve essere di 6 caratteri'
      });
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc('verify_discount_redemption', {
        p_redemption_code: redemptionCode.toUpperCase(),
        p_location_id: selectedLocation
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          success: true,
          message: 'Sconto verificato con successo!',
          details: data
        });
        setRedemptionCode('');
        loadRecentRedemptions();
      } else {
        setResult({
          success: false,
          message: data.error || 'Errore durante la verifica'
        });
      }
    } catch (error) {
      console.error('Error verifying redemption:', error);
      setResult({
        success: false,
        message: 'Errore durante la verifica del codice'
      });
    } finally {
      setVerifying(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">Verifica Codice Sconto</h3>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede *
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Seleziona sede...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.business_name} - {location.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice di Riscatto (6 caratteri) *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={redemptionCode}
                onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                placeholder="ABC123"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Inserisci il codice mostrato dal cliente
            </p>
          </div>

          {result && (
            <div className={`rounded-lg p-4 ${
              result.success
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.message}
                  </p>
                  {result.success && result.details && (
                    <div className="mt-3 space-y-2 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        <span className="font-semibold">{result.details.discount_title}</span>
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          -{result.details.discount_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Cliente: <strong>{result.details.customer_name}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Verificato: {formatDateTime(result.details.confirmed_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || !selectedLocation || redemptionCode.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verifica in corso...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verifica Codice</span>
              </>
            )}
          </button>
        </form>
      </div>

      {recentRedemptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">Sconti Recenti Verificati</h3>
          </div>

          <div className="space-y-3">
            {recentRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-green-600 bg-green-50 px-3 py-1 rounded">
                        {redemption.redemption_code}
                      </span>
                      <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        -{redemption.discount?.discount_percentage}%
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {redemption.discount?.title}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{redemption.customer?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Store className="w-4 h-4" />
                        <span>{redemption.location?.business_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {formatDateTime(redemption.confirmed_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
