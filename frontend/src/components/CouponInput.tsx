import { useState } from 'react';
import { HiOutlineTag, HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import { couponsAPI } from '@/utils/api';
import toast from 'react-hot-toast';

interface CouponInputProps {
  orderAmount: number;
  phone?: string;
  cartItems?: { product: string }[];
  onApplyCoupon: (coupon: AppliedCoupon | null) => void;
  appliedCoupon: AppliedCoupon | null;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discount: number;
}

export default function CouponInput({
  orderAmount,
  phone,
  cartItems,
  onApplyCoupon,
  appliedCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setIsLoading(true);
    try {
      const response = await couponsAPI.validate(
        code.trim(),
        orderAmount,
        phone,
        cartItems
      );

      if (response.data.success) {
        onApplyCoupon(response.data.data);
        toast.success('Áp dụng mã giảm giá thành công!');
        setShowInput(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    setCode('');
    toast.success('Đã xóa mã giảm giá');
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <HiOutlineCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  {appliedCoupon.discountType === 'percentage'
                    ? `-${appliedCoupon.discountValue}%`
                    : `-${appliedCoupon.discountValue.toLocaleString('vi-VN')}đ`}
                </span>
              </div>
              <p className="text-xs text-green-600">{appliedCoupon.description}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 text-green-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 pt-2 border-t border-green-200 flex justify-between text-sm">
          <span className="text-green-700">Tiết kiệm:</span>
          <span className="font-semibold text-green-700">
            -{appliedCoupon.discount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-xl p-3">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full justify-center"
        >
          <HiOutlineTag className="w-4 h-4" />
          Nhập mã giảm giá
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá"
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleApply()}
              />
            </div>
            <button
              onClick={handleApply}
              disabled={isLoading || !code.trim()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                'Áp dụng'
              )}
            </button>
          </div>
          <button
            onClick={() => {
              setShowInput(false);
              setCode('');
            }}
            className="text-xs text-neutral-500 hover:text-neutral-700"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
