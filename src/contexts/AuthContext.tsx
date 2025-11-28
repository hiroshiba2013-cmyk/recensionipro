import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

export interface CustomerData {
  firstName: string;
  lastName: string;
  nickname: string;
  dateOfBirth: string;
  taxCode: string;
  billingAddress: string;
}

export interface BusinessData {
  companyName: string;
  vatNumber: string;
  uniqueCode: string;
  pecEmail: string;
  phone: string;
  billingAddress: string;
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          first_name: data.firstName,
          last_name: data.lastName,
          nickname: data.nickname,
          date_of_birth: data.dateOfBirth,
          tax_code: data.taxCode,
          billing_address: data.billingAddress,
          user_type: 'customer',
          subscription_status: 'expired',
        });

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

      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: authData.user.id,
          category_id: '',
          name: data.companyName,
          vat_number: data.vatNumber,
          unique_code: data.uniqueCode,
          pec_email: data.pecEmail,
          phone: data.phone,
          billing_address: data.billingAddress,
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
