import { useState, useEffect } from 'react';
import { Package, Search, Filter, X, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../components/Router';

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
  rating_average: number;
  rating_count: number;
  brand: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface SearchFilters {
  searchTerm: string;
  categoryId: string;
  brandId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const itemsPerPage = 24;

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    categoryId: '',
    brandId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    setPage(1);
    loadProducts(1);
  }, [filters]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('product_categories')
        .select('*')
        .is('parent_id', null)
        .order('display_order');

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const { data } = await supabase
        .from('product_brands')
        .select('*')
        .order('name');

      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadProducts = async (pageNum: number) => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          brand:product_brands(id, name),
          category:product_categories(id, name)
        `, { count: 'exact' })
        .eq('is_available', true);

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.brandId) {
        query = query.eq('brand_id', filters.brandId);
      }

      if (filters.minPrice) {
        query = query.gte('price', parseFloat(filters.minPrice));
      }

      if (filters.maxPrice) {
        query = query.lte('price', parseFloat(filters.maxPrice));
      }

      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const from = (pageNum - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count } = await query.range(from, to);

      if (pageNum === 1) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(count ? from + (data?.length || 0) < count : false);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage);
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      categoryId: '',
      brandId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
    });
  };

  const hasActiveFilters = filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.searchTerm;

  const calculateDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-10 h-10" />
            <h1 className="text-5xl font-bold">Catalogo Prodotti</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Esplora oltre 300.000 prodotti di ogni genere
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca prodotti..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="flex-1 px-4 py-2 border-0 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filtri</span>
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-white text-blue-600 text-xs rounded-full font-medium">
                  {[filters.categoryId, filters.brandId, filters.minPrice, filters.maxPrice].filter(Boolean).length}
                </span>
              )}
            </button>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Più recenti</option>
              <option value="price_asc">Prezzo: crescente</option>
              <option value="price_desc">Prezzo: decrescente</option>
              <option value="rating">Migliori recensioni</option>
              <option value="popular">Più popolari</option>
            </select>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tutte le categorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <select
                    value={filters.brandId}
                    onChange={(e) => setFilters({ ...filters, brandId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tutte le marche</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo minimo
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo massimo
                  </label>
                  <input
                    type="number"
                    placeholder="2000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Azzera Filtri
              </button>
            </div>
          )}
        </div>

        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nessun prodotto trovato</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const discount = calculateDiscount(product.price, product.original_price);

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.slug}`)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                      {discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold z-10">
                          -{discount}%
                        </div>
                      )}
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-20 h-20 text-gray-300" />
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {product.rating_average.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({product.rating_count})
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {product.currency === 'EUR' ? '€' : product.currency} {product.price.toFixed(2)}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-gray-500 line-through">
                            €{product.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {product.stock_quantity > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-medium">
                            {product.stock_quantity} disponibili
                          </span>
                          <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Esaurito</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Caricamento...' : 'Carica altri prodotti'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
