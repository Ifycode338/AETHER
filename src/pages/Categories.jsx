import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Package, Search } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) console.error('Error loading categories:', error);
      else setCategories(data || []);
      setLoading(false);
    };
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 pb-28 md:pb-12">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-[#0A3D2E] dark:text-white mb-2">Categories</h1>
        <p className="text-sm text-[#0A3D2E]/50 dark:text-white/50">Browse products by category</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2F1E7] dark:border-[#22C55E]/10 bg-white dark:bg-[#071f15] text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 text-[#0A3D2E]/40 dark:text-white/40">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(category => (
            <Link
              key={category.id}
              to={`/shop?category=${category.name.toLowerCase()}`}
              className="group bg-white dark:bg-[#071f15] border border-[#E2F1E7] dark:border-[#22C55E]/10 rounded-2xl p-6 hover:border-[#22C55E] dark:hover:border-[#22C55E]/30 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mb-4 group-hover:bg-[#22C55E]/20 transition-colors">
                <span className="text-2xl">📂</span>
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60 line-clamp-2">
                {category.description || "Browse products in this category"}
              </p>
              <div className="mt-4 text-sm text-[#22C55E] font-medium group-hover:underline">
                Browse products →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
