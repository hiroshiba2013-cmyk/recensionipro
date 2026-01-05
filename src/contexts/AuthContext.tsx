import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, FamilyMember } from '../lib/supabase';

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
  website?: string;
  description?: string;
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

export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  avatar_url?: string | null;
}

export interface ActiveProfile {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string | null;
  isOwner: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  familyMembers: FamilyMember[];
  businessLocations: BusinessLocation[];
  activeProfile: ActiveProfile | null;
  needsProfileSelection: boolean;
  signUpCustomer: (email: string, password: string, data: CustomerData) => Promise<void>;
  signUpBusiness: (email: string, password: string, data: BusinessData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveProfile: (profileId: string, isOwner: boolean) => void;
  loadFamilyMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(null);
  const [needsProfileSelection, setNeedsProfileSelection] = useState(false);

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
          setFamilyMembers([]);
          setBusinessLocations([]);
          setActiveProfileState(null);
          setNeedsProfileSelection(false);
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

      if (data && data.user_type === 'customer') {
        await loadFamilyMembersInternal(userId, data);
      } else if (data && data.user_type === 'business') {
        await loadBusinessLocationsInternal(userId, data);
      } else {
        const ownerProfile: ActiveProfile = {
          id: userId,
          name: data?.full_name || '',
          nickname: (data as any)?.nickname,
          avatarUrl: (data as any)?.avatar_url,
          isOwner: true,
        };
        setActiveProfileState(ownerProfile);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const loadFamilyMembersInternal = async (userId: string, profileData: Profile) => {
    try {
      const { data: members } = await supabase
        .from('customer_family_members')
        .select('*')
        .eq('customer_id', userId);

      setFamilyMembers(members || []);

      const savedProfileId = localStorage.getItem(`activeProfile_${userId}`);
      const savedIsOwner = localStorage.getItem(`activeProfileIsOwner_${userId}`) === 'true';

      if (savedProfileId) {
        if (savedIsOwner) {
          setActiveProfileState({
            id: userId,
            name: profileData.full_name,
            nickname: (profileData as any)?.nickname,
            avatarUrl: (profileData as any)?.avatar_url,
            isOwner: true,
          });
          setNeedsProfileSelection(false);
        } else {
          const member = members?.find(m => m.id === savedProfileId);
          if (member) {
            setActiveProfileState({
              id: member.id,
              name: `${member.first_name} ${member.last_name}`,
              nickname: member.nickname,
              avatarUrl: member.avatar_url,
              isOwner: false,
            });
            setNeedsProfileSelection(false);
          } else {
            setNeedsProfileSelection((members?.length || 0) > 0);
          }
        }
      } else {
        if ((members?.length || 0) > 0) {
          setNeedsProfileSelection(true);
        } else {
          setActiveProfileState({
            id: userId,
            name: profileData.full_name,
            nickname: (profileData as any)?.nickname,
            avatarUrl: (profileData as any)?.avatar_url,
            isOwner: true,
          });
        }
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    if (!user?.id) return;
    const { data: members } = await supabase
      .from('customer_family_members')
      .select('*')
      .eq('customer_id', user.id);
    setFamilyMembers(members || []);
  };

  const loadBusinessLocationsInternal = async (userId: string, profileData: Profile) => {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (!business) {
        const ownerProfile: ActiveProfile = {
          id: userId,
          name: profileData.full_name,
          nickname: (profileData as any)?.nickname,
          avatarUrl: (profileData as any)?.avatar_url,
          isOwner: true,
        };
        setActiveProfileState(ownerProfile);
        setLoading(false);
        return;
      }

      const { data: locations } = await supabase
        .from('business_locations')
        .select('id, name, address, city, province, avatar_url')
        .eq('business_id', business.id);

      setBusinessLocations(locations || []);

      const savedLocationId = localStorage.getItem(`activeLocation_${userId}`);
      const savedIsOwner = localStorage.getItem(`activeLocationIsOwner_${userId}`) === 'true';

      if (savedLocationId) {
        if (savedIsOwner) {
          setActiveProfileState({
            id: userId,
            name: profileData.full_name,
            nickname: (profileData as any)?.nickname,
            avatarUrl: (profileData as any)?.avatar_url,
            isOwner: true,
          });
          setNeedsProfileSelection(false);
        } else {
          const location = locations?.find(l => l.id === savedLocationId);
          if (location) {
            setActiveProfileState({
              id: location.id,
              name: location.name,
              nickname: `${location.city}, ${location.province}`,
              avatarUrl: location.avatar_url,
              isOwner: false,
            });
            setNeedsProfileSelection(false);
          } else {
            setNeedsProfileSelection((locations?.length || 0) > 0);
          }
        }
      } else {
        if ((locations?.length || 0) > 0) {
          setNeedsProfileSelection(true);
        } else {
          setActiveProfileState({
            id: userId,
            name: profileData.full_name,
            nickname: (profileData as any)?.nickname,
            avatarUrl: (profileData as any)?.avatar_url,
            isOwner: true,
          });
        }
      }
    } catch (error) {
      console.error('Error loading business locations:', error);
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
          category_id: null,
          name: data.companyName,
          vat_number: data.vatNumber,
          unique_code: data.uniqueCode,
          ateco_code: data.atecoCode,
          pec_email: data.pecEmail,
          phone: data.phone,
          website_url: data.website || null,
          description: data.description || null,
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
    if (user?.id) {
      localStorage.removeItem(`activeProfile_${user.id}`);
      localStorage.removeItem(`activeProfileIsOwner_${user.id}`);
      localStorage.removeItem(`activeLocation_${user.id}`);
      localStorage.removeItem(`activeLocationIsOwner_${user.id}`);
    }
  };

  const setActiveProfile = (profileId: string, isOwner: boolean) => {
    if (!user?.id || !profile) return;

    if (isOwner) {
      const ownerProfile: ActiveProfile = {
        id: user.id,
        name: profile.full_name,
        nickname: (profile as any)?.nickname,
        avatarUrl: (profile as any)?.avatar_url,
        isOwner: true,
      };
      setActiveProfileState(ownerProfile);

      if (profile.user_type === 'customer') {
        localStorage.setItem(`activeProfile_${user.id}`, user.id);
        localStorage.setItem(`activeProfileIsOwner_${user.id}`, 'true');
      } else if (profile.user_type === 'business') {
        localStorage.setItem(`activeLocation_${user.id}`, user.id);
        localStorage.setItem(`activeLocationIsOwner_${user.id}`, 'true');
      }
    } else {
      if (profile.user_type === 'customer') {
        const member = familyMembers.find(m => m.id === profileId);
        if (member) {
          const memberProfile: ActiveProfile = {
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            nickname: member.nickname,
            avatarUrl: member.avatar_url,
            isOwner: false,
          };
          setActiveProfileState(memberProfile);
        }
        localStorage.setItem(`activeProfile_${user.id}`, profileId);
        localStorage.setItem(`activeProfileIsOwner_${user.id}`, String(isOwner));
      } else if (profile.user_type === 'business') {
        const location = businessLocations.find(l => l.id === profileId);
        if (location) {
          const locationProfile: ActiveProfile = {
            id: location.id,
            name: location.name,
            nickname: `${location.city}, ${location.province}`,
            avatarUrl: location.avatar_url,
            isOwner: false,
          };
          setActiveProfileState(locationProfile);
        }
        localStorage.setItem(`activeLocation_${user.id}`, profileId);
        localStorage.setItem(`activeLocationIsOwner_${user.id}`, String(isOwner));
      }
    }

    setNeedsProfileSelection(false);
  };

  const value = {
    user,
    profile,
    loading,
    familyMembers,
    businessLocations,
    activeProfile,
    needsProfileSelection,
    signUpCustomer,
    signUpBusiness,
    signIn,
    signOut,
    setActiveProfile,
    loadFamilyMembers,
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
