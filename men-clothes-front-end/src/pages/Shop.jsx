import { useEffect, useState } from 'react';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import Filters from '../components/product/Filters';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { ChevronDown } from 'lucide-react';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: '', brandId: '', size: '', minPrice: '', maxPrice: '',
  });
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    fetchProducts();
  }, [filters, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.brandId) params.append('brandId', filters.brandId);
      if (filters.size) params.append('size', filters.size);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      const res = await api.get(`/api/products?${params.toString()}`);
      let data = res.data;
      if (sortBy === 'price_asc') data.sort((a, b) => a.price - b.price);
      if (sortBy === 'price_desc') data.sort((a, b) => b.price - a.price);
      if (sortBy === 'name_asc') data.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24">
      <div className="container-premium py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-light text-brand-800">Our Collection</h1>
          <p className="text-brand-500 mt-2">Timeless pieces for every occasion</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="sticky top-32 bg-white rounded-2xl shadow-premium border border-brand-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-brand-800">Filters</h3>
                <button onClick={() => setFilters({ categoryId: '', brandId: '', size: '', minPrice: '', maxPrice: '' })} className="text-sm text-brand-500 hover:text-brand-700 underline">
                  Reset all
                </button>
              </div>
              <Filters filters={filters} setFilters={setFilters} />
            </div>
          </aside>

          <main className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-brand-500">{products.length} products</p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-brand-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="default">Sort by: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-brand-100">
                <p className="text-brand-500 text-lg">No products match your filters.</p>
                <button onClick={() => setFilters({ categoryId: '', brandId: '', size: '', minPrice: '', maxPrice: '' })} className="mt-4 text-brand-600 underline hover:text-brand-800">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {products.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}