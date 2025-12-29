import { useState, useEffect } from 'react';
import { HiStar, HiThumbUp } from 'react-icons/hi';
import { Review } from '@/types';
import { reviewsAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import ReviewForm from './ReviewForm';
import toast from 'react-hot-toast';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [helpedReviews, setHelpedReviews] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await reviewsAPI.getByProduct(productId);
      if (response.data.success) {
        setReviews(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleHelpful = async (reviewId: string) => {
    if (helpedReviews.has(reviewId)) {
      toast.error('Bạn đã đánh dấu hữu ích');
      return;
    }

    try {
      const response = await reviewsAPI.markHelpful(reviewId);
      if (response.data.success) {
        setReviews(reviews.map(r =>
          r._id === reviewId
            ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 }
            : r
        ));
        setHelpedReviews(new Set([...helpedReviews, reviewId]));
        toast.success('Cảm ơn bạn!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Calculate stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl">
          Đánh Giá Sản Phẩm
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showForm ? 'Đóng' : 'Viết Đánh Giá'}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="mb-6">
          <ReviewForm
            productId={productId}
            onReviewSubmitted={() => {
              setShowForm(false);
              fetchReviews();
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-neutral-50 rounded-xl p-6 text-center">
          <p className="text-neutral-500 mb-3 text-sm">
            Chưa có đánh giá nào cho sản phẩm này
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-primary hover:underline"
            >
              Viết đánh giá đầu tiên →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Compact Rating Summary */}
          <div className="bg-neutral-50 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Average Rating */}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-neutral-800">{avgRating}</span>
                <div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(Number(avgRating)) ? 'fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500">{reviews.length} đánh giá</p>
                </div>
              </div>

              {/* Compact Distribution */}
              <div className="flex items-center gap-3 flex-wrap">
                {ratingCounts.map(({ star, count }) => (
                  <div
                    key={star}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      count > 0 ? 'bg-white shadow-sm' : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <span>{star}</span>
                    <HiStar className={`w-3 h-3 ${count > 0 ? 'text-amber-400 fill-current' : 'text-neutral-300'}`} />
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>

              {/* Sort - Moved to summary bar */}
              <div className="ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-neutral-200 rounded-lg bg-white focus:border-primary outline-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="helpful">Hữu ích nhất</option>
                  <option value="highest">Cao nhất</option>
                  <option value="lowest">Thấp nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {sortedReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg p-4 shadow-sm border border-neutral-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-medium">
                      {review.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{review.user?.name || 'Khách'}</span>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <HiStar
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-neutral-200'}`}
                          />
                        ))}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                          ✓ Đã mua
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 ml-auto">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-600 mt-2">{review.comment}</p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image)}
                            alt={`Ảnh ${index + 1}`}
                            className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}

                    {/* Helpful Button */}
                    <button
                      onClick={() => handleHelpful(review._id)}
                      disabled={helpedReviews.has(review._id)}
                      className={`flex items-center gap-1 text-xs mt-2 transition-colors ${
                        helpedReviews.has(review._id)
                          ? 'text-primary'
                          : 'text-neutral-400 hover:text-primary'
                      }`}
                    >
                      <HiThumbUp className={`w-3.5 h-3.5 ${helpedReviews.has(review._id) ? 'fill-current' : ''}`} />
                      {review.helpfulCount || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
