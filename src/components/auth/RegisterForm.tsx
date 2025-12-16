import { useState } from 'react';
import { useAuth, CustomerData, BusinessData } from '../../contexts/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FamilyMember {
  firstName: string;
  lastName: string;
  nickname: string;
  dateOfBirth: string;
  taxCode: string;
  relationship: string;
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BusinessLocation {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  businessHours: BusinessHours;
}

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [userType, setUserType] = useState<'customer' | 'business'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpCustomer, signUpBusiness } = useAuth();

  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const [numberOfLocations, setNumberOfLocations] = useState('1');
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [businessBillingPeriod, setBusinessBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const [customerForm, setCustomerForm] = useState<CustomerData & { email: string; password: string; confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nickname: '',
    relationship: 'Titolare',
    dateOfBirth: '',
    taxCode: '',
    phone: '',
    billingStreet: '',
    billingStreetNumber: '',
    billingPostalCode: '',
    billingCity: '',
    billingProvince: '',
  });

  const [businessForm, setBusinessForm] = useState<BusinessData & { email: string; password: string; confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    vatNumber: '',
    uniqueCode: '',
    atecoCode: '',
    pecEmail: '',
    phone: '',
    website: '',
    billingStreet: '',
    billingStreetNumber: '',
    billingPostalCode: '',
    billingCity: '',
    billingProvince: '',
    officeStreet: '',
    officeStreetNumber: '',
    officePostalCode: '',
    officeCity: '',
    officeProvince: '',
  });

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessForm(prev => ({ ...prev, [name]: value }));
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, {
      firstName: '',
      lastName: '',
      nickname: '',
      dateOfBirth: '',
      taxCode: '',
      relationship: 'Coniuge',
    }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const addBusinessLocation = () => {
    const defaultHours: DayHours = { open: '09:00', close: '18:00', closed: false };
    setBusinessLocations([...businessLocations, {
      name: 'Sede',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
      businessHours: {
        monday: defaultHours,
        tuesday: defaultHours,
        wednesday: defaultHours,
        thursday: defaultHours,
        friday: defaultHours,
        saturday: { ...defaultHours, closed: true },
        sunday: { ...defaultHours, closed: true },
      },
    }]);
  };

  const removeBusinessLocation = (index: number) => {
    setBusinessLocations(businessLocations.filter((_, i) => i !== index));
  };

  const updateBusinessLocation = (index: number, field: keyof BusinessLocation, value: string) => {
    const updated = [...businessLocations];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessLocations(updated);
  };

  const updateBusinessHours = (locationIndex: number, day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    const updated = [...businessLocations];
    updated[locationIndex] = {
      ...updated[locationIndex],
      businessHours: {
        ...updated[locationIndex].businessHours,
        [day]: {
          ...updated[locationIndex].businessHours[day],
          [field]: value,
        },
      },
    };
    setBusinessLocations(updated);
  };

  const getSubscriptionPrice = (persons: string, period: 'monthly' | 'yearly') => {
    const prices = {
      '1': { monthly: 0.49, yearly: 4.90 },
      '2': { monthly: 0.79, yearly: 7.90 },
      '3': { monthly: 1.09, yearly: 10.90 },
      '4': { monthly: 1.49, yearly: 14.90 },
    };
    return prices[persons as keyof typeof prices][period];
  };

  const getSavings = (persons: string) => {
    const monthly = getSubscriptionPrice(persons, 'monthly');
    const yearly = getSubscriptionPrice(persons, 'yearly');
    const yearlyIfMonthly = monthly * 12;
    return yearlyIfMonthly - yearly;
  };

  const getBusinessSubscriptionPrice = (locations: string, period: 'monthly' | 'yearly') => {
    const prices = {
      '1': { monthly: 2.49, yearly: 24.90 },
      '2': { monthly: 3.99, yearly: 39.90 },
      '3': { monthly: 5.49, yearly: 54.90 },
      '4': { monthly: 7.99, yearly: 79.90 },
      '5': { monthly: 9.99, yearly: 99.90 },
      '6-10': { monthly: 12.99, yearly: 129.90 },
      '10+': { monthly: 14.99, yearly: 149.90 },
    };
    return prices[locations as keyof typeof prices][period];
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (customerForm.password !== customerForm.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);

    try {
      const { email, password, confirmPassword, ...data } = customerForm;
      await signUpCustomer(email, password, data as CustomerData);

      const { data: { user } } = await supabase.auth.getUser();

      if (user && familyMembers.length > 0) {
        const membersToInsert = familyMembers.map(member => ({
          customer_id: user.id,
          first_name: member.firstName,
          last_name: member.lastName,
          nickname: member.nickname,
          date_of_birth: member.dateOfBirth,
          tax_code: member.taxCode,
          relationship: member.relationship,
        }));

        const { error: membersError } = await supabase
          .from('customer_family_members')
          .insert(membersToInsert);

        if (membersError) throw membersError;
      }

      if (user) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('max_persons', parseInt(numberOfPeople))
          .eq('billing_period', billingPeriod)
          .single();

        if (plan) {
          const endDate = new Date();
          if (billingPeriod === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }

          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              customer_id: user.id,
              plan_id: plan.id,
              status: 'active',
              end_date: endDate.toISOString(),
            });

          if (subscriptionError) throw subscriptionError;
        }
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (businessForm.password !== businessForm.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);

    try {
      const { email, password, confirmPassword, ...data } = businessForm;
      await signUpBusiness(email, password, data as BusinessData);

      const { data: { user } } = await supabase.auth.getUser();

      if (user && businessLocations.length > 0) {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (businesses) {
          const locationsToInsert = businessLocations.map((location, index) => ({
            business_id: businesses.id,
            name: location.name,
            address: location.address,
            city: location.city,
            province: location.province,
            postal_code: location.postalCode,
            phone: location.phone,
            email: location.email,
            business_hours: location.businessHours,
            is_primary: index === 0,
          }));

          const { error: locationsError } = await supabase
            .from('business_locations')
            .insert(locationsToInsert);

          if (locationsError) throw locationsError;
        }
      }

      if (user) {
        let maxPersonsValue = parseInt(numberOfLocations);
        if (numberOfLocations === '6-10') {
          maxPersonsValue = 10;
        } else if (numberOfLocations === '10+') {
          maxPersonsValue = 999;
        }

        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('max_persons', maxPersonsValue)
          .eq('billing_period', businessBillingPeriod)
          .like('name', 'Piano Business%')
          .single();

        if (plan) {
          const endDate = new Date();
          if (businessBillingPeriod === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }

          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              customer_id: user.id,
              plan_id: plan.id,
              status: 'active',
              end_date: endDate.toISOString(),
            });

          if (subscriptionError) throw subscriptionError;
        }
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setUserType('customer')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            userType === 'customer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Utente Privato
        </button>
        <button
          type="button"
          onClick={() => setUserType('business')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            userType === 'business'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Professionale
        </button>
      </div>

      {userType === 'customer' ? (
        <form onSubmit={handleCustomerSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Per quante persone vuoi aprire l'account?
            </label>
            <SearchableSelect
              value={numberOfPeople}
              onChange={(value) => {
                setNumberOfPeople(value);
                const num = parseInt(value) - 1;
                if (num > familyMembers.length) {
                  const toAdd = num - familyMembers.length;
                  for (let i = 0; i < toAdd; i++) {
                    addFamilyMember();
                  }
                } else if (num < familyMembers.length) {
                  setFamilyMembers(familyMembers.slice(0, num));
                }
              }}
              options={[
                { value: '1', label: '1 persona (solo io)' },
                { value: '2', label: '2 persone' },
                { value: '3', label: '3 persone' },
                { value: '4', label: '4 persone' },
              ]}
              placeholder="Seleziona numero persone"
            />

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Periodo di Fatturazione
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    billingPeriod === 'monthly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold">Mensile</div>
                  <div className="text-lg font-bold mt-1">{getSubscriptionPrice(numberOfPeople, 'monthly').toFixed(2)}€</div>
                  <div className="text-xs text-gray-600">al mese</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    billingPeriod === 'yearly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold">Annuale</div>
                  <div className="text-lg font-bold mt-1">{getSubscriptionPrice(numberOfPeople, 'yearly').toFixed(2)}€</div>
                  <div className="text-xs text-gray-600">all'anno</div>
                  <div className="text-xs text-green-600 font-semibold mt-1">
                    Risparmi {getSavings(numberOfPeople).toFixed(2)}€
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
              <div className="text-sm font-medium text-gray-700">
                Abbonamento Selezionato:
              </div>
              <div className="text-lg font-bold text-blue-600 mt-1">
                {getSubscriptionPrice(numberOfPeople, billingPeriod).toFixed(2)}€
                {billingPeriod === 'monthly' ? '/mese' : '/anno'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Per {numberOfPeople} {parseInt(numberOfPeople) === 1 ? 'persona' : 'persone'}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Dati Titolare Account (Persona 1)</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={customerForm.firstName}
                  onChange={handleCustomerChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={customerForm.lastName}
                  onChange={handleCustomerChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                value={customerForm.nickname}
                onChange={handleCustomerChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Nome visibile per le review"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relazione
              </label>
              <SearchableSelect
                value={customerForm.relationship}
                onChange={(value) => setCustomerForm({ ...customerForm, relationship: value })}
                options={[
                  { value: 'Titolare', label: 'Titolare' },
                  { value: 'Coniuge', label: 'Coniuge' },
                  { value: 'Figlio/a', label: 'Figlio/a' },
                  { value: 'Genitore', label: 'Genitore' },
                  { value: 'Fratello/Sorella', label: 'Fratello/Sorella' },
                  { value: 'Amico/a', label: 'Amico/a' },
                  { value: 'Altro', label: 'Altro familiare' },
                ]}
                placeholder="Seleziona relazione"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Data di Nascita
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={customerForm.dateOfBirth}
                onChange={handleCustomerChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale
              </label>
              <input
                id="taxCode"
                name="taxCode"
                type="text"
                value={customerForm.taxCode}
                onChange={handleCustomerChange}
                required
                placeholder="Es. RSSMRA85T10A562S"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {familyMembers.map((member, index) => (
            <div key={index} className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Dati Persona {index + 2}</h3>
                <button
                  type="button"
                  onClick={() => removeFamilyMember(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={member.firstName}
                    onChange={(e) => updateFamilyMember(index, 'firstName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    value={member.lastName}
                    onChange={(e) => updateFamilyMember(index, 'lastName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={member.nickname}
                  onChange={(e) => updateFamilyMember(index, 'nickname', e.target.value)}
                  required
                  placeholder="Nome visibile per le review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data di Nascita
                </label>
                <input
                  type="date"
                  value={member.dateOfBirth}
                  onChange={(e) => updateFamilyMember(index, 'dateOfBirth', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  value={member.taxCode}
                  onChange={(e) => updateFamilyMember(index, 'taxCode', e.target.value)}
                  required
                  placeholder="Es. RSSMRA85T10A562S"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relazione
                </label>
                <SearchableSelect
                  value={member.relationship}
                  onChange={(value) => updateFamilyMember(index, 'relationship', value)}
                  options={[
                    { value: 'Coniuge', label: 'Coniuge' },
                    { value: 'Figlio/a', label: 'Figlio/a' },
                    { value: 'Genitore', label: 'Genitore' },
                    { value: 'Fratello/Sorella', label: 'Fratello/Sorella' },
                    { value: 'Amico/a', label: 'Amico/a' },
                    { value: 'Altro', label: 'Altro familiare' },
                  ]}
                  placeholder="Seleziona relazione"
                />
              </div>
            </div>
          ))}

          {parseInt(numberOfPeople) === 4 && (
            <button
              type="button"
              onClick={addFamilyMember}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Aggiungi altra persona
            </button>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Dati Account</h3>

            <div className="mb-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={customerForm.email}
                onChange={handleCustomerChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numero di Telefono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={customerForm.phone}
                onChange={handleCustomerChange}
                required
                placeholder="Es. +39 320 1234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="billingStreet" className="block text-sm font-medium text-gray-700 mb-1">
                Via/Piazza
              </label>
              <input
                id="billingStreet"
                name="billingStreet"
                type="text"
                value={customerForm.billingStreet}
                onChange={handleCustomerChange}
                required
                placeholder="Es. Via Roma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-1">
                <label htmlFor="billingStreetNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numero
                </label>
                <input
                  id="billingStreetNumber"
                  name="billingStreetNumber"
                  type="text"
                  value={customerForm.billingStreetNumber}
                  onChange={handleCustomerChange}
                  required
                  placeholder="Es. 42"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  CAP
                </label>
                <input
                  id="billingPostalCode"
                  name="billingPostalCode"
                  type="text"
                  value={customerForm.billingPostalCode}
                  onChange={handleCustomerChange}
                  required
                  placeholder="Es. 00100"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                  Città
                </label>
                <input
                  id="billingCity"
                  name="billingCity"
                  type="text"
                  value={customerForm.billingCity}
                  onChange={handleCustomerChange}
                  required
                  placeholder="Es. Roma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="billingProvince" className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  id="billingProvince"
                  name="billingProvince"
                  type="text"
                  value={customerForm.billingProvince}
                  onChange={handleCustomerChange}
                  required
                  placeholder="Es. RM"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={customerForm.password}
                  onChange={handleCustomerChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={customerForm.confirmPassword}
                  onChange={handleCustomerChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
          >
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBusinessSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quante sedi ha la tua azienda?
            </label>
            <SearchableSelect
              value={numberOfLocations}
              onChange={(value) => {
                setNumberOfLocations(value);
                let num = 1;
                if (value === '6-10') {
                  num = 6;
                } else if (value === '10+') {
                  num = 11;
                } else {
                  num = parseInt(value);
                }
                if (num > businessLocations.length) {
                  const toAdd = num - businessLocations.length;
                  for (let i = 0; i < toAdd; i++) {
                    addBusinessLocation();
                  }
                } else if (num < businessLocations.length) {
                  setBusinessLocations(businessLocations.slice(0, num));
                }
              }}
              options={[
                { value: '1', label: '1 sede' },
                { value: '2', label: '2 sedi' },
                { value: '3', label: '3 sedi' },
                { value: '4', label: '4 sedi' },
                { value: '5', label: '5 sedi' },
                { value: '6-10', label: '6-10 sedi' },
                { value: '10+', label: 'Oltre 10 sedi' },
              ]}
              placeholder="Seleziona numero sedi"
            />

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Periodo di Fatturazione
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBusinessBillingPeriod('monthly')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    businessBillingPeriod === 'monthly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold">Mensile</div>
                  <div className="text-lg font-bold mt-1">{getBusinessSubscriptionPrice(numberOfLocations, 'monthly').toFixed(2)}€</div>
                  <div className="text-xs text-gray-600">al mese + IVA</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessBillingPeriod('yearly')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    businessBillingPeriod === 'yearly'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold">Annuale</div>
                  <div className="text-lg font-bold mt-1">{getBusinessSubscriptionPrice(numberOfLocations, 'yearly').toFixed(2)}€</div>
                  <div className="text-xs text-gray-600">all'anno + IVA</div>
                </button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
              <div className="text-sm font-medium text-gray-700">
                Abbonamento Selezionato:
              </div>
              <div className="text-lg font-bold text-blue-600 mt-1">
                {getBusinessSubscriptionPrice(numberOfLocations, businessBillingPeriod).toFixed(2)}€
                {businessBillingPeriod === 'monthly' ? '/mese' : '/anno'} + IVA
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Per {numberOfLocations} {numberOfLocations === '1' ? 'punto vendita' : 'punti vendita'}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Dati Azienda</h3>

            <div className="mb-3">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Ragione Sociale
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={businessForm.companyName}
                onChange={handleBusinessChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                P.IVA
              </label>
              <input
                id="vatNumber"
                name="vatNumber"
                type="text"
                value={businessForm.vatNumber}
                onChange={handleBusinessChange}
                required
                placeholder="Es. IT12345678900"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="uniqueCode" className="block text-sm font-medium text-gray-700 mb-1">
                Codice Univoco
              </label>
              <input
                id="uniqueCode"
                name="uniqueCode"
                type="text"
                value={businessForm.uniqueCode}
                onChange={handleBusinessChange}
                required
                placeholder="Es. T04X7MT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="atecoCode" className="block text-sm font-medium text-gray-700 mb-1">
                Codice ATECO
              </label>
              <input
                id="atecoCode"
                name="atecoCode"
                type="text"
                value={businessForm.atecoCode}
                onChange={handleBusinessChange}
                required
                placeholder="Es. 47.91.10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={businessForm.email}
                onChange={handleBusinessChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="pecEmail" className="block text-sm font-medium text-gray-700 mb-1">
                PEC Email
              </label>
              <input
                id="pecEmail"
                name="pecEmail"
                type="email"
                value={businessForm.pecEmail}
                onChange={handleBusinessChange}
                required
                placeholder="es. azienda@pec.it"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numero di Telefono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={businessForm.phone}
                onChange={handleBusinessChange}
                required
                placeholder="Es. +39 02 1234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Sito Web (opzionale)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={businessForm.website}
                onChange={handleBusinessChange}
                placeholder="es. https://www.azienda.it"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="billingStreet" className="block text-sm font-medium text-gray-700 mb-1">
                Via/Piazza (Fatturazione)
              </label>
              <input
                id="billingStreet"
                name="billingStreet"
                type="text"
                value={businessForm.billingStreet}
                onChange={handleBusinessChange}
                required
                placeholder="Es. Via Roma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-1">
                <label htmlFor="billingStreetNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numero
                </label>
                <input
                  id="billingStreetNumber"
                  name="billingStreetNumber"
                  type="text"
                  value={businessForm.billingStreetNumber}
                  onChange={handleBusinessChange}
                  required
                  placeholder="Es. 42"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  CAP
                </label>
                <input
                  id="billingPostalCode"
                  name="billingPostalCode"
                  type="text"
                  value={businessForm.billingPostalCode}
                  onChange={handleBusinessChange}
                  required
                  placeholder="Es. 00100"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                  Città
                </label>
                <input
                  id="billingCity"
                  name="billingCity"
                  type="text"
                  value={businessForm.billingCity}
                  onChange={handleBusinessChange}
                  required
                  placeholder="Es. Roma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="billingProvince" className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  id="billingProvince"
                  name="billingProvince"
                  type="text"
                  value={businessForm.billingProvince}
                  onChange={handleBusinessChange}
                  required
                  placeholder="Es. RM"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                />
              </div>
            </div>
          </div>

          {businessLocations.map((location, index) => (
            <div key={index} className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  {index === 0 ? 'Sede Principale' : `Sede ${index + 1}`}
                </h3>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeBusinessLocation(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Sede
                </label>
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) => updateBusinessLocation(index, 'name', e.target.value)}
                  required
                  placeholder={index === 0 ? 'Sede Principale' : `Sede ${index + 1}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo Completo
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => updateBusinessLocation(index, 'address', e.target.value)}
                  required
                  placeholder="Via/Piazza, numero civico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => updateBusinessLocation(index, 'city', e.target.value)}
                    required
                    placeholder="Es. Milano"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={location.province}
                    onChange={(e) => updateBusinessLocation(index, 'province', e.target.value)}
                    required
                    placeholder="Es. MI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAP
                  </label>
                  <input
                    type="text"
                    value={location.postalCode}
                    onChange={(e) => updateBusinessLocation(index, 'postalCode', e.target.value)}
                    required
                    placeholder="Es. 20121"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono Sede
                  </label>
                  <input
                    type="tel"
                    value={location.phone}
                    onChange={(e) => updateBusinessLocation(index, 'phone', e.target.value)}
                    placeholder="Es. +39 02 1234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Sede (opzionale)
                </label>
                <input
                  type="email"
                  value={location.email}
                  onChange={(e) => updateBusinessLocation(index, 'email', e.target.value)}
                  placeholder="Es. sede@azienda.it"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Orari di Apertura
                </label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                    const dayNames = {
                      monday: 'Lunedì',
                      tuesday: 'Martedì',
                      wednesday: 'Mercoledì',
                      thursday: 'Giovedì',
                      friday: 'Venerdì',
                      saturday: 'Sabato',
                      sunday: 'Domenica',
                    };
                    const dayHours = location.businessHours[day];

                    return (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2 w-28">
                          <input
                            type="checkbox"
                            checked={!dayHours.closed}
                            onChange={(e) => updateBusinessHours(index, day, 'closed', !e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="font-medium">{dayNames[day]}</span>
                        </label>
                        {!dayHours.closed && (
                          <>
                            <input
                              type="time"
                              value={dayHours.open}
                              onChange={(e) => updateBusinessHours(index, day, 'open', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={dayHours.close}
                              onChange={(e) => updateBusinessHours(index, day, 'close', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            />
                          </>
                        )}
                        {dayHours.closed && (
                          <span className="text-gray-500 italic">Chiuso</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addBusinessLocation}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Aggiungi altra sede
          </button>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Dati Accesso</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={businessForm.password}
                  onChange={handleBusinessChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={businessForm.confirmPassword}
                  onChange={handleBusinessChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
          >
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>
      )}
    </div>
  );
}
