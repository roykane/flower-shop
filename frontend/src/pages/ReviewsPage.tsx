import { useState, useEffect } from 'react';
import { HiStar, HiOutlineChatAlt, HiThumbUp } from 'react-icons/hi';
import { Review } from '@/types';
import { reviewsAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [helpedReviews, setHelpedReviews] = useState<Set<string>>(new Set());

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await reviewsAPI.getAll({ limit: 50 });
        if (response.data.success && response.data.data) {
          setReviews(response.data.data);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Calculate rating stats from reviews
  const ratingStats = reviews.length > 0
    ? {
        average: parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)),
        total: reviews.length,
        distribution: [5, 4, 3, 2, 1].map(stars => ({
          stars,
          count: reviews.filter(r => r.rating === stars).length,
        })),
      }
    : {
        average: 0,
        total: 0,
        distribution: [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0 })),
      };

  // Handle helpful button click
  const handleHelpful = async (reviewId: string) => {
    if (helpedReviews.has(reviewId)) {
      toast.error('Bạn đã đánh dấu hữu ích cho đánh giá này');
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
        toast.success('Cảm ơn bạn đã đánh giá!');
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const filteredReviews = reviews
    .filter(review => !filterRating || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'helpful':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        case 'highest':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl mb-4">Đánh Giá Từ Khách Hàng</h1>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state when no reviews
  if (reviews.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl mb-4">Đánh Giá Từ Khách Hàng</h1>
            <p className="text-neutral-600">
              Xem những chia sẻ từ khách hàng đã trải nghiệm dịch vụ của chúng tôi
            </p>
          </div>

          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
              <HiOutlineChatAlt className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-heading text-2xl mb-3">Chưa Có Đánh Giá Nào</h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Hãy là người đầu tiên chia sẻ trải nghiệm của bạn với sản phẩm của chúng tôi!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl mb-4">Đánh Giá Từ Khách Hàng</h1>
          <p className="text-neutral-600">
            Xem những chia sẻ từ khách hàng đã trải nghiệm dịch vụ của chúng tôi
          </p>
        </div>

        {/* Tổng quan đánh giá */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Điểm trung bình */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-6xl font-bold">{ratingStats.average}</span>
                <div>
                  <div className="flex text-amber-400 text-2xl mb-1">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={i < Math.floor(ratingStats.average) ? 'fill-current' : 'text-neutral-300'}
                      />
                    ))}
                  </div>
                  <p className="text-neutral-500">{ratingStats.total} đánh giá</p>
                </div>
              </div>
            </div>

            {/* Phân bố đánh giá */}
            <div className="space-y-2">
              {ratingStats.distribution.map(({ stars, count }) => (
                <button
                  key={stars}
                  onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    filterRating === stars ? 'bg-primary-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-sm w-12">{stars} sao</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: ratingStats.total > 0 ? `${(count / ratingStats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm text-neutral-500 w-10">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Đang hiển thị:</span>
            <span className="font-medium">
              {filterRating ? `${filterRating} sao` : 'Tất cả đánh giá'}
            </span>
            {filterRating && (
              <button
                onClick={() => setFilterRating(null)}
                className="text-primary hover:underline text-sm"
              >
                Xóa
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input w-auto"
          >
            <option value="newest">Mới Nhất</option>
            <option value="helpful">Hữu Ích Nhất</option>
            <option value="highest">Đánh Giá Cao Nhất</option>
          </select>
        </div>

        {/* Danh sách đánh giá */}
        <div className="space-y-6">
          {filteredReviews.map(review => (
            <div key={review._id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-primary font-medium">
                    {review.user.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium">{review.user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <HiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-current' : 'text-neutral-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>·</span>
                        <span>
                          {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Đã Mua Hàng
                      </span>
                    )}
                  </div>

                  {/* Sản phẩm */}
                  {review.product && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      {review.product.images?.[0] && (
                        <img
                          src={getImageUrl(review.product.images[0])}
                          alt={review.product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-neutral-600">{review.product.name}</span>
                    </div>
                  )}

                  {/* Nội dung */}
                  <p className="text-neutral-700 mb-4">{review.comment}</p>

                  {/* Hình ảnh */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={getImageUrl(image)}
                          alt="Ảnh đánh giá"
                          className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  )}

                  {/* Hữu ích */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleHelpful(review._id)}
                      disabled={helpedReviews.has(review._id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        helpedReviews.has(review._id)
                          ? 'text-primary'
                          : 'text-neutral-500 hover:text-primary'
                      }`}
                    >
                      <HiThumbUp className={`w-4 h-4 ${helpedReviews.has(review._id) ? 'fill-current' : ''}`} />
                      Hữu ích ({review.helpfulCount || 0})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-neutral-500">Không tìm thấy đánh giá nào với bộ lọc này.</p>
            <button
              onClick={() => setFilterRating(null)}
              className="text-primary hover:underline text-sm mt-2"
            >
              Xem tất cả đánh giá
            </button>
          </div>
        )}

        {/* Hiển thị tổng số */}
        {filteredReviews.length > 0 && (
          <div className="text-center mt-8 text-neutral-500 text-sm">
            Hiển thị {filteredReviews.length} đánh giá
          </div>
        )}
      </div>
    </div>
  );
}
