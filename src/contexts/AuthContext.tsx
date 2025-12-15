import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export interface CustomerData {
  firstName: string;
  lastName: string;
  nickname?: string;
  relationship?: string;
  dateOfBirth: string;
  taxCode: string;
  phone: string;
  billingStreet: string;
  billingStreetNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingProvince: string;
}

export interface BusinessData {
  companyName: string;
  vatNumber: string;
  uniqueCode: string;
  atecoCode: string;
  pecEmail: string;
  phone: string;
  billingStreet: string;
  billingStreetNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingProvince: string;
  officeStreet?: string;
  officeStreetNumber?: string;
  officePostalCode?: string;
  officeCity?: string;
  officeProvince?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUpCustomer: (email: string, password: string, data: CustomerData) => Promise<void>;
  signUpBusiness: (email: string, password: string, data: BusinessData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUpCustomer = async (email: string, password: string, data: CustomerData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (authData.user) {
      const billingAddress = `${data.billingStreet} ${data.billingStreetNumber}, ${data.billingPostalCode} ${data.billingCity}, ${data.billingProvince}`;

      const profileData: any = {
        id: authData.user.id,
        email,
        full_name: `${data.firstName} ${data.lastName}`,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        tax_code: data.taxCode,
        phone: data.phone,
        billing_street: data.billingStreet,
        billing_street_number: data.billingStreetNumber,
        billing_postal_code: data.billingPostalCode,
        billing_city: data.billingCity,
        billing_province: data.billingProvince.toUpperCase(),
        billing_address: billingAddress,
        user_type: 'customer',
        subscription_status: 'expired',
      };

      if (data.nickname) {
        profileData.nickname = data.nickname;
      }

      if (data.relationship) {
        profileData.relationship = data.relationship;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) throw profileError;
    }
  };

  const signUpBusiness = async (email: string, password: string, data: BusinessData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: data.companyName,
          user_type: 'business',
          subscription_status: 'expired',
        });

      if (profileError) throw profileError;

      const billingAddress = `${data.billingStreet} ${data.billingStreetNumber}, ${data.billingPostalCode} ${data.billingCity}, ${data.billingProvince}`;
      const officeAddress = data.officeStreet && data.officeStreetNumber && data.officePostalCode && data.officeCity && data.officeProvince
        ? `${data.officeStreet} ${data.officeStreetNumber}, ${data.officePostalCode} ${data.officeCity}, ${data.officeProvince}`
        : '';

      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: authData.user.id,
          category_id: '',
          name: data.companyName,
          vat_number: data.vatNumber,
          unique_code: data.uniqueCode,
          ateco_code: data.atecoCode,
          pec_email: data.pecEmail,
          phone: data.phone,
          billing_street: data.billingStreet,
          billing_street_number: data.billingStreetNumber,
          billing_postal_code: data.billingPostalCode,
          billing_city: data.billingCity,
          billing_province: data.billingProvince.toUpperCase(),
          billing_address: billingAddress,
          office_street: data.officeStreet || null,
          office_street_number: data.officeStreetNumber || null,
          office_postal_code: data.officePostalCode || null,
          office_city: data.officeCity || null,
          office_province: data.officeProvince ? data.officeProvince.toUpperCase() : null,
          office_address: officeAddress,
        });

      if (businessError) throw businessError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signUpCustomer,
    signUpBusiness,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
