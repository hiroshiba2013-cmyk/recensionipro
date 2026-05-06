import { Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_at: string;
  business_location: {
    name: string;
  } | null;
}

interface ProductsSectionProps {
  products: Product[];
  onReload: () => Promise<void>;
}

export function ProductsSection({ products, onReload }: ProductsSectionProps) {
  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;

      alert('Giacenza aggiornata');
      await onReload();
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6">
        {/* Dot overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Catalogo
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Prodotti</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
                {products.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Nessun prodotto pubblicato</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 text-left">
                    Prodotto
                  </th>
                  <th className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 text-left">
                    Azienda
                  </th>
                  <th className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 text-left">
                    Prezzo
                  </th>
                  <th className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 text-left">
                    Giacenza
                  </th>
                  <th className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 text-left">
                    Creato il
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.business_location?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">€{product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock > 10
                            ? 'bg-green-100 text-green-800'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stock} unità
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
