import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Star, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewForm({ productId, userId, existingReview, onSuccess, onCancel }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);

    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast.success('Review updated!');
      } else {
        // Try to create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: userId,
            rating,
            comment
          });

        if (error) {
          // If duplicate key error, user already reviewed
          if (error.code === '23505') {
            // Fetch the existing review
            const { data: userReview } = await supabase
              .from('reviews')
              .select('*')
              .eq('product_id', productId)
              .eq('user_id', userId)
              .single();
            
            if (userReview) {
              setExistingReview(userReview);
              toast.info('You already reviewed this product. Please update your review below.');
              return;
            }
          }
          throw error;
        }
        toast.success('Review submitted!');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', existingReview.id);

      if (error) throw error;
      toast.success('Review deleted');
      setShowDeleteConfirm(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#071f15] rounded-2xl p-6 border border-[#E2F1E7] dark:border-white/10 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-[#0A3D2E] dark:text-white">
          {existingReview ? 'Update Your Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[#0A3D2E]/50 hover:text-[#0A3D2E] dark:text-white/50 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-3">
            Your Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-[#FFC107] text-[#FFC107]'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-[#0A3D2E] dark:text-white mb-3">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#E2F1E7] dark:border-white/10 bg-white dark:bg-white/5 text-[#0A3D2E] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none placeholder:text-[#0A3D2E]/40 dark:placeholder:text-white/40"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold h-12 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {existingReview ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {existingReview ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>

          {existingReview && (
            <>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 h-12 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 font-medium transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 h-12 rounded-xl border border-[#E2F1E7] text-[#0A3D2E] hover:bg-[#E2F1E7]/50 dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Delete'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
