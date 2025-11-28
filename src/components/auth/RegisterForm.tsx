import { useState } from 'react';
import { useAuth, CustomerData, BusinessData } from '../../contexts/AuthContext';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [userType, setUserType] = useState<'customer' | 'business'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpCustomer, signUpBusiness } = useAuth();

  const [customerForm, setCustomerForm] = useState<CustomerData & { email: string; password: string; confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nickname: '',
    dateOfBirth: '',
    taxCode: '',
    billingAddress: '',
  });

  const [businessForm, setBusinessForm] = useState<BusinessData & { email: string; password: string; confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    vatNumber: '',
    uniqueCode: '',
    pecEmail: '',
    phone: '',
    billingAddress: '',
  });

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessForm(prev => ({ ...prev, [name]: value }));
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
          Azienda
        </button>
      </div>

      {userType === 'customer' ? (
        <form onSubmit={handleCustomerSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
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

          <div>
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

          <div>
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

          <div>
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

          <div>
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

          <div>
            <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo di Fatturazione
            </label>
            <input
              id="billingAddress"
              name="billingAddress"
              type="text"
              value={customerForm.billingAddress}
              onChange={handleCustomerChange}
              required
              placeholder="Via/Piazza, numero, CAP, Città"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
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

          {error && <div className="text-red-600 text-sm">{error}</div>}

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
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Azienda
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

          <div>
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

          <div>
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

          <div>
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

          <div>
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

          <div>
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

          <div>
            <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo di Fatturazione
            </label>
            <input
              id="billingAddress"
              name="billingAddress"
              type="text"
              value={businessForm.billingAddress}
              onChange={handleBusinessChange}
              required
              placeholder="Via/Piazza, numero, CAP, Città"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
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

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
          >
            {loading ? 'Registrazione...' : 'Registra Azienda'}
          </button>
        </form>
      )}
    </div>
  );
}
