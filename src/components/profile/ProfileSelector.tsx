import { UserCircle2, Building2 } from 'lucide-react';
import { FamilyMember } from '../../lib/supabase';
import { BusinessLocation } from '../../contexts/AuthContext';

export interface ProfileOption {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string | null;
  isOwner: boolean;
}

interface ProfileSelectorProps {
  ownerProfile: ProfileOption;
  familyMembers?: FamilyMember[];
  businessLocations?: BusinessLocation[];
  userType: 'customer' | 'business';
  onSelectProfile: (profileId: string, isOwner: boolean) => void;
}

export function ProfileSelector({ ownerProfile, familyMembers = [], businessLocations = [], userType, onSelectProfile }: ProfileSelectorProps) {
  const profiles: ProfileOption[] = [
    ownerProfile,
    ...(userType === 'customer' ? familyMembers.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      nickname: member.nickname,
      avatarUrl: member.avatar_url,
      isOwner: false,
    })) : businessLocations.map(location => ({
      id: location.id,
      name: location.name,
      nickname: `${location.city}, ${location.province}`,
      avatarUrl: location.avatar_url,
      isOwner: false,
    }))),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userType === 'customer' ? 'Seleziona il Profilo' : 'Seleziona la Sede'}
          </h1>
          <p className="text-gray-600">
            {userType === 'customer'
              ? 'Con quale profilo desideri navigare?'
              : 'Con quale sede desideri navigare?'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile.id, profile.isOwner)}
              className="flex flex-col items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 group-hover:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-gray-200 group-hover:border-blue-500 transition-all">
                  {userType === 'business' && !profile.isOwner ? (
                    <Building2 className="w-16 h-16 text-white" />
                  ) : (
                    <UserCircle2 className="w-16 h-16 text-white" />
                  )}
                </div>
              )}

              <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {profile.name}
                </h3>
                {profile.nickname && (
                  <p className="text-sm text-gray-600 mt-1">
                    "{profile.nickname}"
                  </p>
                )}
                {profile.isOwner && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {userType === 'customer' ? 'Account Principale' : 'Sede Principale'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          {userType === 'customer'
            ? 'Potrai cambiare profilo in qualsiasi momento dalle impostazioni'
            : 'Potrai cambiare sede in qualsiasi momento dalle impostazioni'}
        </div>
      </div>
    </div>
  );
}
