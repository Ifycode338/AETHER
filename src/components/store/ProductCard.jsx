import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Video as VideoIcon, Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";

export default function ProductCard({ product, onAddToCart }) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const categoryLabel = product.category === "supplements" ? "Supplement" : "Oral Care";

  useEffect(() => {
    if (!user) return;
    
    const checkWishlist = async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      
      if (!error && data) {
        setIsWishlisted(true);
      } else {
        setIsWishlisted(false);
      }
    };
    
    checkWishlist();
  }, [user, product.id]);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }
    
    setLoadingWishlist(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: product.id });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-[#E2F1E7]/50 dark:bg-white/10 aspect-square mb-4">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#0A3D2E]/20 dark:text-white/20">
              <span className="text-6xl font-heading font-bold">B</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0A3D2E]/60 dark:text-white/80 bg-white/80 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {categoryLabel}
            </span>
          </div>
          {product.video_url && (
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg">
                <VideoIcon className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        <div className="px-1">
          <h3 className="font-heading font-semibold text-[#0A3D2E] dark:text-white text-sm mb-1 group-hover:text-[#22C55E] transition-colors">
            {product.name}
          </h3>
          {product.ingredients && (
            <p className="text-xs text-[#0A3D2E]/40 dark:text-white/60 mb-2 line-clamp-1">{product.ingredients}</p>
          )}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-heading font-bold text-[#0A3D2E] dark:text-white">₦{product.price?.toFixed(2)}</p>
            {product.stock > 10 ? (
              <span className="text-xs text-[#22C55E] dark:text-green-400">In Stock</span>
            ) : product.stock > 0 ? (
              <span className="text-xs text-orange-500 dark:text-orange-400">Only {product.stock} left</span>
            ) : (
              <span className="text-xs text-red-500 dark:text-red-400">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
        className="absolute bottom-16 right-2 w-9 h-9 rounded-full bg-[#22C55E] text-[#051510] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#16a34a] focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2"
        aria-label={`Add ${product.name} to cart`}
      >
        <Plus className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleWishlistToggle}
        disabled={loadingWishlist}
        className="absolute bottom-16 right-14 w-9 h-9 rounded-full bg-white dark:bg-[#071f15] text-[#0A3D2E] dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-[#22C55E]/10 focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 disabled:opacity-50"
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>
    </div>
  );
}