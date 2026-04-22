import { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuctionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categories = [
  'Elettronica',
  'Abbigliamento',
  'Casa e Giardino',
  'Sport',
  'Collezionismo',
  'Auto e Moto',
  'Libri',
  'Giocattoli',
  'Arte',
  'Altro'
];

const conditions = [
  { value: 'new', label: 'Nuovo' },
  { value: 'like_new', label: 'Come Nuovo' },
  { value: 'good', label: 'Buone Condizioni' },
  { value: 'fair', label: 'Condizioni Discrete' },
  { value: 'poor', label: 'Condizioni Mediocri' }
];

const durations = [
  { value: 1, label: '1 giorno' },
  { value: 3, label: '3 giorni' },
  { value: 5, label: '5 giorni' },
  { value: 7, label: '7 giorni' },
  { value: 10, label: '10 giorni' },
  { value: 14, label: '14 giorni' }
];

export default function AuctionForm({ onSuccess, onCancel }: AuctionFormProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    base_price: '',
    category: categories[0],
    condition: 'good',
    city: profile?.billing_city || '',
    province: profile?.billing_province || '',
    region: '',
    duration: 7
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError('Puoi caricare massimo 5 immagini');
      return;
    }

    setImages([...images, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(previewUrls[index]);
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('auction-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (images.length === 0) {
        throw new Error('Aggiungi almeno una immagine');
      }

      const imageUrls = await uploadImages();

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + formData.duration);

      const { error: insertError } = await supabase
        .from('auctions')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          images: imageUrls,
          category: formData.category,
          condition: formData.condition,
          city: formData.city,
          province: formData.province,
          region: formData.region,
          ends_at: endsAt.toISOString(),
          status: 'pending',
          approval_status: 'pending'
        });

      if (insertError) throw insertError;

      alert('Asta creata con successo! Sarà visibile dopo l\'approvazione da parte dell\'amministratore.');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const depositAmount = parseFloat(formData.base_price) <= 500 ? 5 : 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titolo Asta *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="es. iPhone 13 Pro 256GB"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrizione *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Descrivi l'oggetto in dettaglio..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base d'Asta (€) *
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {formData.base_price && (
            <p className="mt-1 text-sm text-gray-600">
              Deposito richiesto: <span className="font-semibold">{depositAmount}€</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durata Asta *
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {durations.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condizioni *
          </label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {conditions.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Città *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia *
          </label>
          <input
            type="text"
            required
            maxLength={2}
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="VA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regione *
          </label>
          <input
            type="text"
            required
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Lombardia"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Immagini * (max 5)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="auction-images"
            disabled={images.length >= 5}
          />
          <label
            htmlFor="auction-images"
            className={`flex flex-col items-center cursor-pointer ${
              images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Clicca per caricare immagini
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {images.length}/5 immagini caricate
            </span>
          </label>
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Informazioni Importanti</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Gli utenti dovranno pagare un deposito di {depositAmount}€ per partecipare</li>
          <li>• Il deposito verrà restituito alla fine dell'asta</li>
          <li>• Dopo la chiusura, avrai 48 ore per confermare la transazione</li>
          <li>• La piattaforma non gestisce pagamenti o spedizioni</li>
        </ul>
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Annulla
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creazione...' : 'Crea Asta'}
        </button>
      </div>
    </form>
  );
}
