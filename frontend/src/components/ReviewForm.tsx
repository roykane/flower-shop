import { useState, useRef } from 'react';
import { HiStar, HiOutlinePhotograph, HiX } from 'react-icons/hi';
import { reviewsAPI, uploadAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import { useAuthStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 images
    if (images.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh cho mỗi đánh giá');
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} vượt quá 5MB`);
        continue;
      }

      try {
        const response = await uploadAPI.uploadImage(file);
        if (response.data.success) {
          newImages.push(response.data.data.url);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Lỗi upload ${file.name}`);
      }
    }

    setImages([...images, ...newImages]);
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reviewsAPI.create({
        product: productId,
        rating,
        comment: comment.trim(),
        images,
      });

      if (response.data.success) {
        toast.success('Đánh giá của bạn đã được gửi!');
        setRating(0);
        setComment('');
        setImages([]);
        onReviewSubmitted?.();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center">
        <p className="text-neutral-600 mb-4">
          Vui lòng đăng nhập để viết đánh giá
        </p>
        <Link to="/login" className="btn btn-primary">
          Đăng Nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-heading text-lg mb-4">Viết Đánh Giá</h3>

      {/* Rating Stars */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Đánh giá của bạn <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <HiStar
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'text-amber-400 fill-current'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-neutral-500 self-center">
            {rating > 0 && (
              <>
                {rating === 1 && 'Rất tệ'}
                {rating === 2 && 'Tệ'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Tốt'}
                {rating === 5 && 'Tuyệt vời'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Nhận xét <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Tối thiểu 10 ký tự ({comment.length}/1000)
        </p>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Thêm hình ảnh (tùy chọn)
        </label>

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={getImageUrl(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <HiOutlinePhotograph className="w-5 h-5" />
                  Thêm ảnh ({images.length}/5)
                </>
              )}
            </button>
            <p className="text-xs text-neutral-500 mt-1">
              Hỗ trợ JPG, PNG, GIF. Tối đa 5MB mỗi ảnh.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang gửi...
          </span>
        ) : (
          'Gửi Đánh Giá'
        )}
      </button>
    </form>
  );
}
