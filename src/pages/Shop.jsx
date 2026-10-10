import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { toast } from "sonner";

export default function Shop() {
  const { addToCart } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  const [category, setCategory] = useState(categoryParam || "all");

  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("category");
    if (cat) setCategory(cat);
  }, [window.location.search]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const query = supabase.from('products').select('*').eq('is_active', true);
      if (category !== "all") {
        query.eq('category', category);
      }
      const { data, error } = await query.order('created_date', { ascending: false }).limit(50);
      if (error) console.error('Error loading products:', error);
      else setProducts(data || []);
      setLoading(false);
    };
    loadProducts();
  }, [category]);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesPrice = 
      (!priceRange.min || p.price >= parseFloat(priceRange.min)) &&
      (!priceRange.max || p.price <= parseFloat(priceRange.max));
    const matchesStock = !inStockOnly || p.stock > 0;
    return matchesSearch && matchesPrice && matchesStock;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      case 'newest':
      default:
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters = priceRange.min || priceRange.max || inStockOnly || sortBy !== 'newest';

  return (
    <div className="min-h-screen">
      <div className="bg-[#0A3D2E] dark:bg-[#0A3D2E] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-3">
            {category === "supplements" ? "Supplements" : category === "oral_care" ? "Oral Care" : "All Products"}
          </h1>
          <p className="text-white/70 dark:text-white/60 text-sm">
            Clinical-grade wellness, delivered to your door.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-10">
          <div className="flex flex-wrap gap-2">
            {["all", "supplements", "oral_care"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  category === cat
                    ? "bg-[#0A3D2E] text-white dark:bg-[#22C55E] dark:text-[#051510]"
                    : "bg-[#E2F1E7] text-[#0A3D2E]/70 hover:bg-[#0A3D2E]/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                }`}
              >
                {cat === "all" ? "All" : cat === "supplements" ? "Supplements" : "Oral Care"}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D2E]/30 dark:text-white/30" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E2F1E7] bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] text-[#0A3D2E] dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/40"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]'
                  : 'border-[#E2F1E7] text-[#0A3D2E]/70 hover:bg-[#E2F1E7]/30 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#E2F1E7]/30 dark:bg-white/5 rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Price Range */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-3">Price Range (₦)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2F1E7] bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <span className="text-[#0A3D2E]/40 dark:text-white/40">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2F1E7] bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-3">Sort By</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2F1E7] bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A3D2E]/40 dark:text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Stock Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-3">Availability</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E2F1E7] accent-[#22C55E]"
                  />
                  <span className="text-sm text-[#0A3D2E] dark:text-white">In Stock Only</span>
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-[#22C55E] hover:text-[#16a34a] flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60">
            {sorted.length} {sorted.length === 1 ? 'product' : 'products'} found
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#22C55E] hover:text-[#16a34a] flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#E2F1E7] dark:bg-white/10 rounded-2xl aspect-square mb-4" />
                <div className="h-4 bg-[#E2F1E7] dark:bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#E2F1E7] dark:bg-white/10 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#E2F1E7]/30 dark:bg-white/10 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-[#E2F1E7] dark:text-white/30" />
            </div>
            <p className="text-[#0A3D2E]/40 dark:text-white/40 text-lg mb-2">No products found</p>
            <p className="text-sm text-[#0A3D2E]/30 dark:text-white/30 mb-4">Try adjusting your filters or search terms</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[#22C55E] hover:text-[#16a34a] font-medium text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">
            {sorted.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}