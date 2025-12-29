import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineQrcode,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineGift,
  HiOutlinePhotograph,
  HiOutlineUpload,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '@/store/useStore';
import { ordersAPI } from '@/utils/api';
import { getImageUrl, API_URL } from '@/utils/helpers';
// import CouponInput, { AppliedCoupon } from '@/components/CouponInput';

// Thông tin ngân hàng cho chuyển khoản
const BANK_INFO = {
  bankName: 'VietinBank',
  bankBin: '970415', // VietQR bank BIN code for VietinBank
  accountNumber: '105870789428',
  accountName: 'LE THI CAM TU',
  branch: 'CN Kiên Giang - Hội Sở',
};

interface CheckoutForm {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  deliveryDate: string;
  deliveryTime: string;
  giftMessage?: string;
  note?: string;
}

type PaymentMethod = 'cod' | 'bank_transfer' | 'momo';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderPhone, setOrderPhone] = useState(''); // For guest order lookup
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Auto payment check states
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [checkTimeRemaining, setCheckTimeRemaining] = useState(20);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showUploadOption, setShowUploadOption] = useState(false);

  // Coupon state - temporarily disabled
  // const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      city: 'An Giang',
    },
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
  const shipping = subtotal >= 750000 ? 0 : 30000;
  const discount = 0; // Coupon disabled
  const total = subtotal + shipping - discount;

  // Generate QR content for bank transfer
  const generateQRContent = (orderIdParam: string) => {
    // VietQR format URL - uses bank BIN code
    return `https://img.vietqr.io/image/${BANK_INFO.bankBin}-${BANK_INFO.accountNumber}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(orderIdParam)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  const onSubmit = async (data: CheckoutForm) => {
    setIsProcessing(true);

    try {
      // Prepare order data for API
      const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          ward: data.ward,
          district: data.district,
          province: data.city,
          city: data.city,
        },
        paymentMethod: paymentMethod,
        deliveryDate: data.deliveryDate,
        giftMessage: data.giftMessage,
        note: data.note,
        couponCode: null, // Coupon disabled
      };

      // Create order via API - use guest API if not logged in
      const response = isAuthenticated
        ? await ordersAPI.create(orderData)
        : await ordersAPI.createGuest(orderData);

      if (response.data.success) {
        const createdOrder = response.data.data;
        // Use orderCode if available, fallback to _id
        setOrderId(createdOrder.orderCode || createdOrder._id);
        setOrderPhone(data.phone); // Save phone for guest order lookup

        if (paymentMethod === 'cod') {
          clearCart();
          toast.success('Đặt hàng thành công! Shop sẽ gọi xác nhận trong 30 phút.', {
            duration: 5000,
            icon: '📞',
          });
          // Navigate based on auth status
          if (isAuthenticated) {
            navigate('/orders');
          } else {
            // For guest, show success page with order info
            setOrderPlaced(true);
          }
        } else {
          // Show payment instruction screen
          setOrderPlaced(true);
          toast('Vui lòng thanh toán và gửi xác nhận qua Zalo', {
            duration: 5000,
            icon: '💳',
          });
        }
      } else {
        throw new Error(response.data.message || 'Không thể tạo đơn hàng');
      }
    } catch (err: any) {
      console.error('Create order error:', err);
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteOrder = () => {
    // Block if auto-check failed and no proof uploaded
    if (showUploadOption && !uploadSuccess) {
      toast.error('Vui lòng upload ảnh xác nhận thanh toán trước khi tiếp tục!', {
        duration: 5000,
        icon: '⚠️',
      });
      return;
    }

    clearCart();
    toast.success('Cảm ơn bạn! Shop sẽ xác nhận đơn hàng sau khi kiểm tra thanh toán.', {
      duration: 5000,
      icon: '✅',
    });
    if (isAuthenticated) {
      navigate('/orders');
    } else {
      navigate('/');
    }
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // Generate Zalo message for payment confirmation
  const generateZaloMessage = () => {
    return encodeURIComponent(
      `Xin chào! Em vừa chuyển khoản thanh toán đơn hàng:\n` +
      `- Mã đơn: ${orderId}\n` +
      `- Số tiền: ${total.toLocaleString('vi-VN')}đ\n` +
      `- Hình thức: ${paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'MoMo'}\n` +
      `Nhờ shop xác nhận giúp em ạ!`
    );
  };

  // Handle payment proof file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  // Upload payment proof
  const handleUploadPaymentProof = async () => {
    if (!paymentProofFile) {
      toast.error('Vui lòng chọn ảnh chụp màn hình thanh toán');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', paymentProofFile);
      formData.append('orderCode', orderId);

      const response = await fetch(`${API_URL}/upload/payment-proof`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadSuccess(true);
        toast.success('Gửi xác nhận thành công! Shop sẽ kiểm tra trong ít phút.', {
          duration: 5000,
          icon: '✅',
        });
      } else {
        throw new Error(data.message || 'Lỗi upload');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Lỗi khi gửi xác nhận. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  // Check payment status from bank
  const checkPaymentStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/orders/check-payment/${orderId}`);
      const data = await response.json();

      if (data.success && data.data.isPaid) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Check payment error:', error);
      return false;
    }
  };

  // Start auto-checking payment
  const startPaymentCheck = async () => {
    setIsCheckingPayment(true);
    setCheckTimeRemaining(20);
    setShowUploadOption(false);

    const startTime = Date.now();
    const checkInterval = 3000; // Check every 3 seconds
    const timeout = 20000; // 20 seconds total

    const check = async () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((timeout - elapsed) / 1000));
      setCheckTimeRemaining(remaining);

      // Check if payment confirmed
      const isPaid = await checkPaymentStatus();

      if (isPaid) {
        setPaymentConfirmed(true);
        setIsCheckingPayment(false);
        clearCart();
        toast.success('Thanh toán đã được xác nhận! Cảm ơn bạn.', {
          duration: 5000,
          icon: '🎉',
        });
        return;
      }

      // Check if timeout
      if (elapsed >= timeout) {
        setIsCheckingPayment(false);
        setShowUploadOption(true);
        toast('Chưa nhận được xác nhận tự động. Vui lòng gửi ảnh thanh toán.', {
          duration: 5000,
          icon: '⏰',
        });
        return;
      }

      // Continue checking
      setTimeout(check, checkInterval);
    };

    // Start first check after a short delay
    setTimeout(check, 1000);
  };

  // Show order success/payment instruction screen
  if (orderPlaced) {
    // COD order success for guest
    if (paymentMethod === 'cod' && !isAuthenticated) {
      return (
        <div className="py-8 px-4 min-h-screen bg-neutral-50">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCheck className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="font-heading text-2xl mb-2">Đặt Hàng Thành Công!</h1>
                <p className="text-neutral-600">Shop sẽ gọi xác nhận trong 30 phút.</p>
              </div>

              {/* Order info for guest */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium mb-3">Thông Tin Đơn Hàng</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-primary">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Số điện thoại:</span>
                    <span className="font-medium">{orderPhone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Lưu ý:</strong> Bạn có thể tra cứu đơn hàng bằng <strong>Mã đơn hàng</strong> và <strong>Số điện thoại</strong> tại trang <a href="/track-order" className="underline font-medium">Tra cứu đơn hàng</a>.
                </p>
              </div>

              <div className="space-y-3">
                <a href="/" className="btn btn-primary w-full block text-center">
                  Tiếp Tục Mua Sắm
                </a>
                <a href="/track-order" className="btn btn-secondary w-full block text-center">
                  Tra Cứu Đơn Hàng
                </a>
              </div>

              <p className="text-xs text-neutral-500 mt-4 text-center">
                Hotline hỗ trợ: <a href="tel:0839477199" className="text-primary font-medium">0839 477 199</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Payment instruction screen (bank transfer/MoMo)
    return (
      <div className="py-8 px-4 min-h-screen bg-neutral-50">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Header - Pending status */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="font-heading text-2xl mb-2">Đơn Hàng Chờ Thanh Toán</h1>
              <p className="text-neutral-600">
                Mã đơn hàng: <span className="font-semibold text-primary">{orderId}</span>
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                  <HiOutlineCheck className="w-5 h-5" />
                </div>
                <span className="text-sm text-green-700 font-medium">Đặt hàng</span>
              </div>
              <div className="w-8 h-0.5 bg-neutral-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-medium animate-pulse">
                  2
                </div>
                <span className="text-sm text-amber-700 font-medium">Thanh toán</span>
              </div>
              <div className="w-8 h-0.5 bg-neutral-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm text-neutral-500">Xác nhận</span>
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 text-left">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <HiOutlineQrcode className="w-5 h-5" />
                    Bước 1: Quét mã QR để chuyển khoản
                  </h3>

                  <div className="flex justify-center mb-4">
                    <img
                      src={generateQRContent(orderId)}
                      alt="QR Code chuyển khoản"
                      className="w-48 h-48 rounded-lg border-4 border-white shadow-lg"
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Ngân hàng:</span>
                      <span className="font-medium">{BANK_INFO.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Số tài khoản:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{BANK_INFO.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(BANK_INFO.accountNumber, 'số tài khoản')}
                          className="text-primary hover:text-primary-dark"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Chủ tài khoản:</span>
                      <span className="font-medium">{BANK_INFO.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Số tiền:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {total.toLocaleString('vi-VN')}đ
                        </span>
                        <button
                          onClick={() => copyToClipboard(total.toString(), 'số tiền')}
                          className="text-primary hover:text-primary-dark"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Nội dung CK:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{orderId}</span>
                        <button
                          onClick={() => copyToClipboard(orderId, 'mã đơn hàng')}
                          className="text-primary hover:text-primary-dark"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'momo' && (
              <div className="space-y-4">
                <div className="bg-pink-50 rounded-xl p-4 text-left">
                  <h3 className="font-semibold text-pink-900 mb-3">Bước 1: Thanh toán qua MoMo</h3>
                  <div className="flex justify-center mb-4">
                    <div className="w-40 h-40 bg-white rounded-lg border-4 border-pink-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-xs text-neutral-600">Quét mã MoMo</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Số điện thoại:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">0975 221 900</span>
                        <button
                          onClick={() => copyToClipboard('0975221900', 'số điện thoại')}
                          className="text-primary hover:text-primary-dark"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Số tiền:</span>
                      <span className="font-semibold text-primary">{total.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <span className="text-neutral-600">Nội dung:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{orderId}</span>
                        <button
                          onClick={() => copyToClipboard(orderId, 'mã đơn hàng')}
                          className="text-primary hover:text-primary-dark"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Confirmation */}
            <div className="mt-4 bg-green-50 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <HiOutlinePhotograph className="w-5 h-5" />
                Bước 2: Xác nhận thanh toán
              </h3>

              {/* Payment confirmed successfully */}
              {paymentConfirmed ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <HiOutlineCheck className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-green-700 font-semibold text-lg mb-1">Thanh toán thành công!</p>
                  <p className="text-sm text-green-600 mb-4">Đơn hàng của bạn đã được xác nhận.</p>
                  <button
                    onClick={() => isAuthenticated ? navigate('/orders') : navigate('/')}
                    className="btn btn-primary"
                  >
                    {isAuthenticated ? 'Xem đơn hàng' : 'Tiếp tục mua sắm'}
                  </button>
                </div>
              ) : uploadSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HiOutlineCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium mb-1">Đã gửi xác nhận thành công!</p>
                  <p className="text-sm text-green-600">Shop sẽ kiểm tra và xác nhận trong ít phút.</p>
                </div>
              ) : isCheckingPayment ? (
                /* Checking payment status */
                <div className="text-center py-6">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    {/* Spinning circle */}
                    <svg className="animate-spin w-20 h-20" viewBox="0 0 100 100">
                      <circle
                        className="text-green-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * (20 - checkTimeRemaining)) / 20}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    {/* Countdown number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">{checkTimeRemaining}</span>
                    </div>
                  </div>
                  <p className="text-green-800 font-medium mb-2">Đang kiểm tra thanh toán...</p>
                  <p className="text-sm text-green-600">
                    Hệ thống đang xác nhận giao dịch từ ngân hàng
                  </p>
                  <div className="mt-4 flex justify-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              ) : !showUploadOption ? (
                /* Initial state - Button to start checking */
                <div className="text-center py-4">
                  <p className="text-sm text-green-800 mb-4">
                    Sau khi chuyển khoản xong, bấm nút bên dưới để xác nhận thanh toán.
                  </p>
                  <button
                    onClick={startPaymentCheck}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheck className="w-5 h-5" />
                    Tôi đã thanh toán
                  </button>
                  <p className="text-xs text-green-600 mt-3">
                    Hệ thống sẽ tự động kiểm tra giao dịch từ ngân hàng
                  </p>
                </div>
              ) : (
                /* Timeout - Show upload option */
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">⏰</span>
                      </div>
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Chưa nhận được xác nhận tự động</p>
                        <p className="text-sm text-amber-700">
                          Hệ thống chưa nhận được thông báo từ ngân hàng. Để đơn hàng được xử lý nhanh chóng, vui lòng:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reminder if no image uploaded */}
                  {!paymentProofFile && !paymentProofPreview && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 animate-pulse">
                      <div className="flex items-center gap-2 text-red-700">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-medium">
                          Bạn chưa upload ảnh xác nhận thanh toán!
                        </p>
                      </div>
                      <p className="text-xs text-red-600 mt-1 ml-7">
                        Vui lòng chụp màn hình giao dịch thành công và gửi để shop xác nhận đơn hàng.
                      </p>
                    </div>
                  )}

                  {/* File upload area */}
                  <div className="mb-3">
                    {paymentProofPreview ? (
                      <div className="relative">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full max-h-48 object-contain rounded-lg border-2 border-green-200 bg-white"
                        />
                        <button
                          onClick={() => {
                            setPaymentProofFile(null);
                            setPaymentProofPreview('');
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 rounded-xl cursor-pointer bg-white hover:bg-green-50 transition-colors">
                        <HiOutlineUpload className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-sm text-green-600 font-medium">Chọn ảnh chụp màn hình</span>
                        <span className="text-xs text-green-500 mt-1">PNG, JPG (tối đa 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleUploadPaymentProof}
                    disabled={!paymentProofFile || isUploading}
                    className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      paymentProofFile && !isUploading
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-200 text-green-500 cursor-not-allowed'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <HiOutlineUpload className="w-5 h-5" />
                        Gửi ảnh xác nhận
                      </>
                    )}
                  </button>

                  {/* Retry auto check */}
                  <button
                    onClick={startPaymentCheck}
                    className="w-full mt-2 py-2 text-green-600 text-sm font-medium hover:bg-green-100 rounded-lg transition-colors"
                  >
                    🔄 Kiểm tra lại tự động
                  </button>

                  {/* Zalo alternative */}
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-600 text-center mb-2">Hoặc gửi qua Zalo</p>
                    <a
                      href={`https://zalo.me/0944600344?text=${generateZaloMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86z"/>
                      </svg>
                      Gửi qua Zalo
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Guest order tracking info */}
            {!isAuthenticated && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tra cứu đơn hàng:</strong> Sử dụng mã <strong className="font-mono">{orderId}</strong> và số điện thoại <strong>{orderPhone}</strong> để tra cứu tại <a href="/track-order" className="underline font-medium">trang tra cứu</a>.
                </p>
              </div>
            )}

            {/* Important note - only show when auto-check failed */}
            {showUploadOption && !uploadSuccess && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Quan trọng:</strong> Đơn hàng sẽ chỉ được xử lý sau khi shop nhận được xác nhận thanh toán.
                  Vui lòng gửi ảnh chụp màn hình giao dịch thành công.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {/* Only show button when payment confirmed OR proof uploaded */}
              {(paymentConfirmed || uploadSuccess) && (
                <button onClick={handleCompleteOrder} className="btn btn-primary w-full">
                  Tôi Đã Thanh Toán & Gửi Xác Nhận
                </button>
              )}
              {!isAuthenticated && (
                <a href="/track-order" className="btn btn-outline w-full block text-center">
                  Tra Cứu Đơn Hàng
                </a>
              )}
              <button
                onClick={() => {
                  clearCart();
                  navigate('/');
                }}
                className="btn btn-secondary w-full"
              >
                Về Trang Chủ
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-4 text-center">
              Hotline hỗ trợ: <a href="tel:0839477199" className="text-primary font-medium">0839 477 199</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 bg-neutral-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-2xl md:text-3xl mb-6">Thanh Toán</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Thông tin người nhận */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    1
                  </span>
                  Thông Tin Người Nhận
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                      {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      className={`input ${errors.phone ? 'border-red-500' : ''}`}
                      {...register('phone', {
                        required: 'Vui lòng nhập số điện thoại',
                        pattern: {
                          value: /^(0|\+84)[\s.-]?[0-9]{2,4}[\s.-]?[0-9]{3}[\s.-]?[0-9]{3,4}$/,
                          message: 'Số điện thoại không hợp lệ',
                        },
                      })}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email (tùy chọn)</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className="input"
                      {...register('email')}
                    />
                  </div>
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    2
                  </span>
                  <HiOutlineTruck className="w-5 h-5" />
                  Địa Chỉ Giao Hàng
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường..."
                      className={`input ${errors.address ? 'border-red-500' : ''}`}
                      {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Phường/Xã"
                      className={`input ${errors.ward ? 'border-red-500' : ''}`}
                      {...register('ward', { required: 'Bắt buộc' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Quận/Huyện"
                      className={`input ${errors.district ? 'border-red-500' : ''}`}
                      {...register('district', { required: 'Bắt buộc' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Tỉnh/Thành phố"
                      className={`input ${errors.city ? 'border-red-500' : ''}`}
                      {...register('city', { required: 'Bắt buộc' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Ngày giao <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className={`input ${errors.deliveryDate ? 'border-red-500' : ''}`}
                      {...register('deliveryDate', { required: 'Bắt buộc' })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Khung giờ giao</label>
                    <select className="input" {...register('deliveryTime')}>
                      <option value="morning">Sáng (8:00 - 12:00)</option>
                      <option value="afternoon">Chiều (13:00 - 17:00)</option>
                      <option value="evening">Tối (17:00 - 20:00)</option>
                      <option value="anytime">Bất kỳ lúc nào</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lời nhắn */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <HiOutlineGift className="w-5 h-5 text-primary" />
                  Lời Nhắn & Ghi Chú
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Lời nhắn tặng (in trên thiệp)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Chúc mừng sinh nhật! Yêu thương..."
                      className="input"
                      {...register('giftMessage')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Ghi chú cho shop</label>
                    <textarea
                      rows={2}
                      placeholder="Gọi trước khi giao, để ngoài cổng..."
                      className="input"
                      {...register('note')}
                    />
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    3
                  </span>
                  Phương Thức Thanh Toán
                </h2>

                <div className="space-y-3">
                  {/* COD */}
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <HiOutlineCash className="w-6 h-6 text-green-600" />
                        <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        Thanh toán bằng tiền mặt khi nhận được hàng
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      Phổ biến
                    </span>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <HiOutlineQrcode className="w-6 h-6 text-blue-600" />
                        <span className="font-medium">Chuyển khoản ngân hàng</span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        Quét mã QR hoặc chuyển khoản thủ công
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Nhanh
                    </span>
                  </label>

                  {/* MoMo */}
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'momo'
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'momo'}
                      onChange={() => setPaymentMethod('momo')}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          M
                        </div>
                        <span className="font-medium">Ví MoMo</span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">Thanh toán qua ứng dụng MoMo</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-4">
                <h2 className="font-semibold text-lg mb-4">Đơn Hàng ({items.length} sản phẩm)</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.product._id} className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getImageUrl(item.product.images?.[0] || '')}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg bg-neutral-100"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-sm text-primary font-semibold">
                          {((item.product.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                {/* Coupon Input - temporarily disabled */}
                {/* <div className="mb-4">
                  <CouponInput
                    orderAmount={subtotal}
                    cartItems={items.map(item => ({ product: item.product._id }))}
                    onApplyCoupon={setAppliedCoupon}
                    appliedCoupon={appliedCoupon}
                  />
                </div> */}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Tạm tính</span>
                    <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Phí giao hàng</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                      {shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-neutral-500">
                      Miễn phí giao hàng cho đơn từ 750.000đ
                    </p>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <hr className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold text-lg">Tổng cộng</span>
                  <span className="font-bold text-xl text-primary">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary w-full py-3 text-base disabled:opacity-70"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
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
                      Đang xử lý...
                    </span>
                  ) : (
                    `Đặt Hàng - ${total.toLocaleString('vi-VN')}đ`
                  )}
                </button>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>🔒</span>
                    <span>Thông tin của bạn được bảo mật</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>📞</span>
                    <span>Hotline: 0839 477 199</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
