import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '../components/Router';
import { ArrowLeft, Star, ShoppingCart, Package, Truck, Shield, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  currency: string;
  stock_quantity: number;
  is_available: boolean;
  images: string[];
  specifications: Record<string, any>;
  rating_average: number;
  rating_count: number;
  view_count: number;
  brand: {
    id: string;
    name: string;
    description: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:product_brands(id, name, description),
          category:product_categories(id, name)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;

      setProduct(data);

      await supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!product?.original_price || product.original_price <= product.price) return 0;
    return Math.round(((product.original_price - product.price) / product.original_price) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prodotto non trovato</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Torna al catalogo
          </button>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Torna al catalogo</span>
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-lg font-bold z-10">
                    -{discount}%
                  </div>
                )}
                {product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-32 h-32 text-gray-300" />
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-blue-600 font-medium mb-2">{product.brand.name}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating_average)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {product.rating_average.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({product.rating_count} recensioni)
                </span>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {product.currency === 'EUR' ? '€' : product.currency} {product.price.toFixed(2)}
                  </span>
                  {product.original_price && (
                    <span className="text-xl text-gray-500 line-through">
                      €{product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-green-600 font-medium">
                    Risparmi €{(product.original_price! - product.price).toFixed(2)}
                  </p>
                )}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              {product.stock_quantity > 0 ? (
                <div className="mb-6">
                  <p className="text-green-600 font-medium mb-4">
                    ✓ Disponibile ({product.stock_quantity} pezzi)
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm font-medium text-gray-700">Quantità:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      <ShoppingCart className="w-5 h-5" />
                      Aggiungi al carrello
                    </button>
                    <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-red-600 font-medium mb-4">✗ Non disponibile</p>
                  <button className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed">
                    Esaurito
                  </button>
                </div>
              )}

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Spedizione gratuita per ordini sopra €50</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Garanzia di 2 anni</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Reso gratuito entro 30 giorni</span>
                </div>
              </div>
            </div>
          </div>

          {Object.keys(product.specifications).length > 0 && (
            <div className="p-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifiche tecniche</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.brand.description && (
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Informazioni sulla marca</h2>
              <p className="text-gray-700 leading-relaxed">{product.brand.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
