import React, { useState, useEffect } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Minus, Plus, ShoppingBag, Star, Shield, Truck, RefreshCw, Heart, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [zoomLevel, setZoomLevel] = useState({ x: 50, y: 50 });
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error('Error loading product:', error);
      else setProduct(data);
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_date', { ascending: false });
      if (error) console.error('Error loading reviews:', error);
      else setReviews(data || []);
    };
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    
    const checkWishlist = async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      
      if (!error && data) {
        setIsWishlisted(true);
      } else {
        setIsWishlisted(false);
      }
    };
    
    checkWishlist();
  }, [user, id]);

  useEffect(() => {
    const loadRelatedProducts = async () => {
      if (!product) return;
      
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);
      
      setRelatedProducts(data || []);
    };
    
    loadRelatedProducts();
  }, [product, id]);

  // Auto-switch images every 4 seconds
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedImage(prev => (prev + 1) % product.images.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [product]);

  const handleImageClick = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedImage(index);
      setIsTransitioning(false);
    }, 300);
  };

  const handleZoom = (e) => {
    if (!showZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomLevel({ x, y });
  };

  const toggleZoom = () => {
    setShowZoom(!showZoom);
    if (!showZoom) {
      setZoomLevel({ x: 50, y: 50 });
    }
  };

  const handleAdd = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }
    
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: id });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: id,
        user_id: user.id,
        user_name: user.full_name || user.email,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      
      if (error) throw error;
      
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      
      // Reload reviews
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_date', { ascending: false });
      setReviews(data || []);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review");
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
          <div className="bg-[#E2F1E7] rounded-3xl aspect-square" />
          <div className="py-8">
            <div className="h-6 bg-[#E2F1E7] rounded w-1/4 mb-4" />
            <div className="h-10 bg-[#E2F1E7] rounded w-3/4 mb-4" />
            <div className="h-6 bg-[#E2F1E7] rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 text-center">
        <p className="text-[#0A3D2E]/40 text-lg mb-4">Product not found</p>
        <Link to="/shop" className="text-[#22C55E] text-sm font-medium hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const categoryLabel = product.category === "supplements" ? "Supplement" : "Oral Care";
  const averageRating = calculateAverageRating();

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-[#0A3D2E]/50 hover:text-[#0A3D2E] transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div 
            className="rounded-3xl overflow-hidden bg-[#E2F1E7]/50 aspect-[4/5] sm:aspect-square mb-4 relative cursor-zoom-in"
            onClick={toggleZoom}
            onMouseMove={handleZoom}
            onMouseLeave={() => setShowZoom(false)}
          >
            {product.images && product.images.length > 0 ? (
              <>
                <img 
                  src={product.images[selectedImage]} 
                  alt={`${product.name} - Image ${selectedImage + 1}`} 
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${showZoom ? 'scale-150' : ''}`}
                  style={{ 
                    imageRendering: 'auto',
                    transformOrigin: showZoom && typeof zoomLevel === 'object' 
                      ? `${zoomLevel.x}% ${zoomLevel.y}%` 
                      : 'center'
                  }}
                />
                {showZoom && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/20 rounded-full p-2 text-white text-xs">
                      Click to exit zoom
                    </div>
                  </div>
                )}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          selectedImage === index 
                            ? 'bg-[#22C55E] w-6' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#0A3D2E]/10">
                <span className="text-8xl font-heading font-bold">B</span>
              </div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {product.images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className={`rounded-lg overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                    selectedImage === index 
                      ? 'border-[#22C55E] ring-2 ring-[#22C55E]/20' 
                      : 'border-transparent hover:border-[#22C55E]/30'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`${product.name} - Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ 
                      imageRendering: 'auto'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          
          {product.video_url && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <VideoIcon className="w-4 h-4 text-[#22C55E]" />
                <span className="text-sm font-medium text-[#0A3D2E] dark:text-white">Product Video</span>
              </div>
              <video 
                src={product.video_url} 
                controls 
                className="w-full rounded-xl border border-[#E2F1E7] dark:border-white/10"
                poster={product.images && product.images[0] ? product.images[0] : undefined}
              />
            </div>
          )}
        </div>

        <div className="py-4">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">{categoryLabel}</span>
            <button 
              onClick={handleWishlist}
              className="p-2 rounded-full hover:bg-[#E2F1E7] transition-colors"
              title="Add to wishlist"
            >
              <Heart 
                className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#0A3D2E]/40'}`} 
              />
            </button>
          </div>
          
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#0A3D2E] mt-2 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            {reviews.length > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-[#0A3D2E]/60">({averageRating}) • {reviews.length} reviews</span>
              </>
            ) : (
              <span className="text-sm text-[#0A3D2E]/60">No reviews yet</span>
            )}
          </div>
          
          <p className="font-heading font-bold text-3xl text-[#0A3D2E] mb-6">₦{product.price?.toFixed(2)}</p>
          
          {/* Stock display like Amazon */}
          <div className="mb-6 p-4 rounded-xl bg-[#E2F1E7]/30 border border-[#E2F1E7]">
            {product.stock > 10 ? (
              <div className="flex items-center gap-2">
                <span className="text-[#22C55E] font-semibold text-sm">✓ In Stock</span>
                <span className="text-sm text-[#0A3D2E]/60">({product.stock} available)</span>
              </div>
            ) : product.stock > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-semibold text-sm">⚠ Only {product.stock} left in stock</span>
                <span className="text-xs text-orange-500">- order soon</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-semibold text-sm">✗ Out of Stock</span>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#E2F1E7]/30 text-center">
              <Shield className="w-5 h-5 text-[#22C55E] mb-1" />
              <span className="text-xs text-[#0A3D2E]/70">Quality Assured</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#E2F1E7]/30 text-center">
              <Truck className="w-5 h-5 text-[#22C55E] mb-1" />
              <span className="text-xs text-[#0A3D2E]/70">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#E2F1E7]/30 text-center">
              <RefreshCw className="w-5 h-5 text-[#22C55E] mb-1" />
              <span className="text-xs text-[#0A3D2E]/70">Easy Returns</span>
            </div>
          </div>

          {/* Product information tabs */}
          <div className="mb-8">
            <div className="flex gap-2 sm:gap-4 border-b border-[#E2F1E7] mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'description' 
                    ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                    : 'text-[#0A3D2E]/50 hover:text-[#0A3D2E]'
                }`}
              >
                Description
              </button>
              {product.ingredients && (
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'ingredients' 
                      ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                      : 'text-[#0A3D2E]/50 hover:text-[#0A3D2E]'
                  }`}
                >
                  Ingredients
                </button>
              )}
              {product.benefits && (
                <button
                  onClick={() => setActiveTab('benefits')}
                  className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'benefits' 
                      ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                      : 'text-[#0A3D2E]/50 hover:text-[#0A3D2E]'
                  }`}
                >
                  Benefits
                </button>
              )}
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'reviews' 
                    ? 'text-[#22C55E] border-b-2 border-[#22C55E]' 
                    : 'text-[#0A3D2E]/50 hover:text-[#0A3D2E]'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
            
            {activeTab === 'description' && product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-[#0A3D2E]/70 leading-relaxed text-base">{product.description}</p>
              </div>
            )}
            
            {activeTab === 'ingredients' && product.ingredients && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E2F1E7]/50 to-[#E2F1E7]/30 border border-[#E2F1E7]">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#0A3D2E]/40 mb-4">Ingredients</h3>
                <div className="text-[#0A3D2E]/70 leading-relaxed text-base whitespace-pre-line">{product.ingredients}</div>
              </div>
            )}
            
            {activeTab === 'benefits' && product.benefits && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 border border-[#22C55E]/20">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#22C55E] mb-4">Clinical Benefits</h3>
                <div className="text-[#0A3D2E]/70 leading-relaxed text-base whitespace-pre-line">{product.benefits}</div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold text-[#0A3D2E]">{averageRating}</div>
                    <div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-[#0A3D2E]/60">{reviews.length} reviews</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#22C55E] text-[#051510] font-semibold text-sm hover:bg-[#16a34a] transition-colors"
                  >
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                </div>
                
                {showReviewForm && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E2F1E7]/50 to-[#E2F1E7]/30 border border-[#E2F1E7] space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#0A3D2E] mb-3">Your Rating</label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0A3D2E] mb-3">Your Review</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Share your experience with this product. What did you like or dislike?"
                        className="w-full px-4 py-3 rounded-xl border border-[#E2F1E7] bg-white text-sm text-[#0A3D2E] focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none"
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      className="w-full py-3 rounded-xl bg-[#22C55E] text-[#051510] font-semibold text-sm hover:bg-[#16a34a] transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                )}
                
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-[#E2F1E7]/20 rounded-2xl border-2 border-dashed border-[#E2F1E7]">
                    <Star className="w-12 h-12 text-[#E2F1E7] mx-auto mb-4" />
                    <p className="text-[#0A3D2E]/50 mb-2">No reviews yet</p>
                    <p className="text-sm text-[#0A3D2E]/40">Be the first to share your experience with this product!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-5 rounded-2xl bg-white border border-[#E2F1E7] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16a34a] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {review.user_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-[#0A3D2E]">{review.user_name || 'User'}</span>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-[#0A3D2E]/40">
                            {new Date(review.created_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[#0A3D2E]/70 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-[#E2F1E7] pt-8 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-[#0A3D2E]/50">Quantity</span>
              <div className="flex items-center gap-3 bg-[#E2F1E7]/50 rounded-xl px-3 py-2">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))} 
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  disabled={product.stock === 0}
                >
                  <Minus className="w-4 h-4 text-[#0A3D2E]" />
                </button>
                <span className="w-8 text-center font-medium text-[#0A3D2E]">{qty}</span>
                <button 
                  onClick={() => {
                    if (qty >= (product.stock || 0)) {
                      toast.error(`Only ${product.stock} ${product.stock === 1 ? 'product' : 'products'} available`);
                      return;
                    }
                    setQty(qty + 1);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  disabled={product.stock === 0 || qty >= product.stock}
                >
                  <Plus className="w-4 h-4 text-[#0A3D2E]" />
                </button>
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="w-full bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-14 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {product.stock === 0 
                ? "Out of Stock" 
                : added 
                  ? "Added to Cart ✓" 
                  : `Add to Cart — ₦${(product.price * qty).toFixed(2)}`
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-[#E2F1E7]">
          <h2 className="font-heading font-bold text-2xl text-[#0A3D2E] dark:text-white mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/product/${relatedProduct.id}`}
                className="group"
              >
                <div className="bg-white dark:bg-[#071f15] rounded-2xl overflow-hidden border border-[#E2F1E7] dark:border-[#22C55E]/10 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-[#E2F1E7]/30">
                    {relatedProduct.images && relatedProduct.images.length > 0 ? (
                      <img
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#0A3D2E]/10">
                        <span className="text-4xl font-heading font-bold">B</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-sm text-[#0A3D2E] dark:text-white mb-2 line-clamp-2 group-hover:text-[#22C55E] transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="font-heading font-bold text-lg text-[#0A3D2E] dark:text-white">
                      ₦{relatedProduct.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}