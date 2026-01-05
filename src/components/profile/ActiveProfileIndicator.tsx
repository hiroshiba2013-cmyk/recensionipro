import { useState, useRef, useEffect } from 'react';
import { UserCircle2, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ActiveProfileIndicator() {
  const { profile, activeProfile, familyMembers, businessLocations, setActiveProfile } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeProfile || !profile) return null;

  const isCustomer = profile.user_type === 'customer';
  const isBusiness = profile.user_type === 'business';

  if (isCustomer && familyMembers.length === 0) {
    return null;
  }

  if (isBusiness && businessLocations.length === 0) {
    return null;
  }

  const profiles = [
    {
      id: profile.id,
      name: profile.full_name,
      nickname: (profile as any)?.nickname,
      avatarUrl: (profile as any)?.avatar_url,
      isOwner: true,
    },
    ...(isCustomer ? familyMembers.map(member => ({
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {activeProfile.avatarUrl ? (
          <img
            src={activeProfile.avatarUrl}
            alt={activeProfile.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            {isBusiness && !activeProfile.isOwner ? (
              <Building2 className="w-6 h-6 text-white" />
            ) : (
              <UserCircle2 className="w-6 h-6 text-white" />
            )}
          </div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-gray-900">
            {activeProfile.nickname || activeProfile.name}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase">
              {isCustomer ? 'Cambia Profilo' : 'Cambia Sede'}
            </p>
          </div>
          {profiles.map((prof) => (
            <button
              key={prof.id}
              onClick={() => {
                setActiveProfile(prof.id, prof.isOwner);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                activeProfile.id === prof.id ? 'bg-blue-50' : ''
              }`}
            >
              {prof.avatarUrl ? (
                <img
                  src={prof.avatarUrl}
                  alt={prof.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  {isBusiness && !prof.isOwner ? (
                    <Building2 className="w-7 h-7 text-white" />
                  ) : (
                    <UserCircle2 className="w-7 h-7 text-white" />
                  )}
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-sm">
                  {prof.name}
                </div>
                {prof.nickname && (
                  <div className="text-xs text-gray-600">
                    "{prof.nickname}"
                  </div>
                )}
                {prof.isOwner && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Principale
                  </span>
                )}
              </div>
              {activeProfile.id === prof.id && (
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
