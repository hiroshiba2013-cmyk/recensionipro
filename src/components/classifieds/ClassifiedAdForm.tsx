import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ITALIAN_REGIONS, PROVINCES_BY_REGION, CITIES_BY_PROVINCE } from '../../lib/cities';

interface Category {
  id: string;
  name: string;
}

interface ClassifiedAdFormProps {
  adId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClassifiedAdForm({ adId, onSuccess, onCancel }: ClassifiedAdFormProps) {
  const { user, activeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    ad_type: 'sell' as 'sell' | 'buy' | 'gift',
    category_id: '',
    title: '',
    description: '',
    price: '',
    location: '',
    city: '',
    province: '',
    region: '',
    contact_phone: '',
    contact_email: '',
    images: [] as string[],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
    if (adId) {
      loadAd();
    }
  }, [adId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('classified_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAd = async () => {
    if (!adId) return;

    try {
      const { data, error } = await supabase
        .from('classified_ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      setFormData({
        ad_type: data.ad_type || 'sell',
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        price: data.price?.toString() || '',
        location: data.location,
        city: data.city,
        province: data.province,
        region: data.region,
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        images: data.images || [],
      });

      if (data.images) {
        setImagePreviews(data.images);
      }
    } catch (error) {
      console.error('Error loading ad:', error);
      alert('Errore nel caricamento dell\'annuncio');
    }
  };

  const handleRegionChange = (region: string) => {
    setFormData({
      ...formData,
      region,
      province: '',
      city: '',
    });
  };

  const handleProvinceChange = (province: string) => {
    setFormData({
      ...formData,
      province,
      city: '',
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imagePreviews.length > 5) {
      alert('Puoi caricare massimo 5 immagini');
      return;
    }

    setImageFiles([...imageFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `classified-ads/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('classified-ads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('classified-ads')
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let imageUrls = formData.images;

      if (imageFiles.length > 0) {
        const newUrls = await uploadImages();
        imageUrls = [...imageUrls, ...newUrls];
      }

      const adData = {
        user_id: user.id,
        family_member_id: activeProfile?.isOwner === false ? activeProfile.id : null,
        ad_type: formData.ad_type,
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        location: formData.location,
        city: formData.city,
        province: formData.province,
        region: formData.region,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: 'active',
      };

      if (adId) {
        const { error } = await supabase
          .from('classified_ads')
          .update(adData)
          .eq('id', adId);

        if (error) throw error;
        console.log('Ad updated successfully:', adId);
      } else {
        const { data: insertedData, error } = await supabase
          .from('classified_ads')
          .insert([adData])
          .select();

        if (error) {
          console.error('Error inserting ad:', error);
          throw error;
        }
        console.log('Ad created successfully:', insertedData);
      }

      alert('Annuncio salvato con successo!');
      onSuccess();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Errore nel salvataggio dell\'annuncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {adId ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ad Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo Annuncio *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, ad_type: 'sell' })}
              className={`px-6 py-4 rounded-lg border-2 font-medium transition-all ${
                formData.ad_type === 'sell'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">💰</div>
              <div>Vendo</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, ad_type: 'buy' })}
              className={`px-6 py-4 rounded-lg border-2 font-medium transition-all ${
                formData.ad_type === 'buy'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">🔍</div>
              <div>Cerco</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, ad_type: 'gift' })}
              className={`px-6 py-4 rounded-lg border-2 font-medium transition-all ${
                formData.ad_type === 'gift'
                  ? 'border-orange-600 bg-orange-50 text-orange-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">🎁</div>
              <div>Regalo</div>
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            required
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titolo *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Es. Vendo iPhone 13 Pro come nuovo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            placeholder="Descrivi il tuo annuncio in dettaglio..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prezzo (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Es. 500"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">Lascia vuoto se non applicabile</p>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regione *
            </label>
            <select
              required
              value={formData.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleziona regione</option>
              {ITALIAN_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provincia *
            </label>
            <select
              required
              value={formData.province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={!formData.region}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Seleziona provincia</option>
              {formData.region && PROVINCES_BY_REGION[formData.region]?.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Città *
            </label>
            <select
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={!formData.province}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Seleziona città</option>
              {formData.province && CITIES_BY_PROVINCE[formData.province]?.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indirizzo
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Via, numero civico"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+39 123 456 7890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="email@esempio.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Immagini (max 5)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {imagePreviews.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400" />
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : adId ? 'Salva Modifiche' : 'Pubblica Annuncio'}
          </button>
        </div>
      </form>
    </div>
  );
}
