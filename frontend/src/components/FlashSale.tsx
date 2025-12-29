import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineFire } from 'react-icons/hi';
import { promotionsAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

interface FlashSaleProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number;
  images: string[];
  stock: number;
  stockLimit: number | null;
  soldCount: number;
  discountPercent: number;
}

interface FlashSaleData {
  _id: string;
  name: string;
  description?: string;
  endDate: string;
  showCountdown: boolean;
  primaryColor: string;
  secondaryColor: string;
  products: FlashSaleProduct[];
}

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownTimer({ endDate, primaryColor }: { endDate: string; primaryColor: string }) {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return <span className="text-sm text-neutral-500">Đã kết thúc</span>;
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl"
        style={{ backgroundColor: primaryColor }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[10px] text-neutral-500 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <TimeBlock value={timeLeft.hours} label="Giờ" />
      <span className="text-lg font-bold" style={{ color: primaryColor }}>:</span>
      <TimeBlock value={timeLeft.minutes} label="Phút" />
      <span className="text-lg font-bold" style={{ color: primaryColor }}>:</span>
      <TimeBlock value={timeLeft.seconds} label="Giây" />
    </div>
  );
}

function FlashSaleProductCard({ product, primaryColor }: { product: FlashSaleProduct; primaryColor: string }) {
  const soldPercent = product.stockLimit
    ? Math.min(100, (product.soldCount / product.stockLimit) * 100)
    : 0;

  const isSoldOut = product.stockLimit !== null && product.soldCount >= product.stockLimit;

  return (
    <Link
      to={`/product/${product.slug}`}
      className={`block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
        isSoldOut ? 'opacity-60' : ''
      }`}
    >
      <div className="relative">
        <img
          src={getImageUrl(product.images?.[0] || '')}
          alt={product.name}
          className="w-full aspect-square object-cover"
        />
        {/* Discount badge */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1"
          style={{ backgroundColor: primaryColor }}
        >
          <HiOutlineLightningBolt className="w-3 h-3" />
          -{product.discountPercent}%
        </div>
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Hết hàng</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[40px]">{product.name}</h3>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {product.salePrice.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-sm text-neutral-400 line-through">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Stock progress bar */}
        {product.stockLimit && (
          <div className="mt-2">
            <div className="relative h-4 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${soldPercent}%`,
                  background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}cc)`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-medium text-neutral-700">
                  {isSoldOut ? 'Hết hàng' : `Đã bán ${product.soldCount}/${product.stockLimit}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function FlashSale() {
  const [flashSale, setFlashSale] = useState<FlashSaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await promotionsAPI.getFlashSale();
        if (response.data.success && response.data.data) {
          setFlashSale(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching flash sale:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  if (isLoading) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-neutral-100 rounded-xl aspect-[3/4]" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!flashSale || flashSale.products.length === 0) {
    return null;
  }

  const primaryColor = flashSale.primaryColor || '#e11d48';

  return (
    <section
      className="py-8 px-4"
      style={{
        background: `linear-gradient(135deg, ${flashSale.secondaryColor}20, ${flashSale.secondaryColor}40)`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <HiOutlineFire className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                className="font-heading text-xl sm:text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                {flashSale.name}
              </h2>
              {flashSale.description && (
                <p className="text-sm text-neutral-600">{flashSale.description}</p>
              )}
            </div>
          </div>

          {flashSale.showCountdown && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600">Kết thúc sau:</span>
              <CountdownTimer endDate={flashSale.endDate} primaryColor={primaryColor} />
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {flashSale.products.slice(0, 10).map((product) => (
            <FlashSaleProductCard
              key={product._id}
              product={product}
              primaryColor={primaryColor}
            />
          ))}
        </div>

        {/* View All Link */}
        {flashSale.products.length > 10 && (
          <div className="text-center mt-6">
            <Link
              to={`/promotions/${flashSale._id}`}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Xem tất cả
              <HiOutlineLightningBolt className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
