import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Star, User, Calendar, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewList({ productId, userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // Load reviews without relationship to avoid schema cache issues
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user data separately for each review
      const reviewsWithUsers = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profiles: profile
          };
        })
      );
      
      setReviews(reviewsWithUsers);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      toast.success('Review deleted');
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#22C55E] animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-[#E2F1E7]/20 dark:bg-white/5 rounded-2xl border-2 border-dashed border-[#E2F1E7] dark:border-white/10">
        <Star className="w-12 h-12 text-[#E2F1E7] dark:text-white/20 mx-auto mb-4" />
        <p className="text-[#0A3D2E]/50 dark:text-white/50 mb-2">No reviews yet</p>
        <p className="text-sm text-[#0A3D2E]/40 dark:text-white/40">Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white dark:bg-[#071f15] rounded-xl p-5 border border-[#E2F1E7] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center">
                {review.profiles?.avatar_url ? (
                  <img
                    src={review.profiles.avatar_url}
                    alt={review.profiles.full_name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-[#22C55E]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-[#0A3D2E] dark:text-white">
                  {review.profiles?.full_name || 'Verified Customer'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#0A3D2E]/50 dark:text-white/50 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.created_at)}
                </div>
              </div>
            </div>
            
            {/* Rating Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'fill-[#FFC107] text-[#FFC107]'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Review Content */}
          <p className="text-sm text-[#0A3D2E]/80 dark:text-white/80 leading-relaxed">
            {review.comment}
          </p>

          {/* Delete Button (for own reviews) */}
          {userId === review.user_id && (
            <button
              onClick={() => handleDelete(review.id)}
              disabled={deletingId === review.id}
              className="mt-4 text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deletingId === review.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  Delete Review
                </>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
