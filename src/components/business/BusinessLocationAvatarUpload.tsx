import { useState, useRef } from 'react';
import { MapPin, Upload, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessLocationAvatarUploadProps {
  locationId: string;
  currentAvatarUrl: string | null;
  onAvatarUpdate: (url: string) => void;
}

export function BusinessLocationAvatarUpload({
  locationId,
  currentAvatarUrl,
  onAvatarUpdate
}: BusinessLocationAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Per favore seleziona un file immagine');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Il file è troppo grande. Massimo 5MB');
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `business-locations/${locationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('business_locations')
        .update({ avatar_url: publicUrl })
        .eq('id', locationId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Errore durante il caricamento dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Foto sede"
            className="w-full h-full object-cover"
          />
        ) : (
          <MapPin className="w-10 h-10 text-white" />
        )}
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        type="button"
        className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Carica foto sede"
      >
        {uploading ? (
          <Loader className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
