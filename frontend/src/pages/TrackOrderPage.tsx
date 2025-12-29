import { useState } from 'react';
import { HiOutlineSearch, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { ordersAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

const statusLabels: Record<string, string> = {
  pending: 'Chờ Xử Lý',
  confirmed: 'Đã Xác Nhận',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao',
  delivered: 'Đã Giao',
  cancelled: 'Đã Hủy',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentMethodLabels: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản',
  momo: 'Ví MoMo',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'text-yellow-600',
  paid: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-neutral-600',
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ mã đơn hàng và số điện thoại');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await ordersAPI.lookupGuest(orderId.trim(), phone.trim());
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      const response = await ordersAPI.cancelGuest(
        order.orderCode || order._id,
        phone,
        cancelReason || undefined
      );
      if (response.data.success) {
        setOrder(response.data.data);
        setShowCancelConfirm(false);
        setCancelReason('');
        toast.success('Đã hủy đơn hàng thành công!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if order can be cancelled (only pending or confirmed)
  const canCancelOrder = order && ['pending', 'confirmed'].includes(order.orderStatus || '');

  return (
    <div className="py-8 px-4 min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl mb-2">Tra Cứu Đơn Hàng</h1>
          <p className="text-neutral-600">
            Nhập mã đơn hàng và số điện thoại để xem trạng thái đơn hàng của bạn
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Mã đơn hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Nhập mã đơn hàng (VD: DH00001)"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại đặt hàng..."
                  className="input pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tìm kiếm...
                </span>
              ) : (
                'Tra Cứu Đơn Hàng'
              )}
            </button>
          </form>
        </div>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b">
              <div>
                <p className="text-sm text-neutral-500">Mã đơn hàng</p>
                <p className="font-semibold text-lg text-primary">
                  {order.orderCode || `#${order._id.slice(-8)}`}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.orderStatus || 'pending']}`}>
                  {statusLabels[order.orderStatus || 'pending']}
                </span>
                {canCancelOrder && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <HiOutlineX className="w-4 h-4" />
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Lịch sử đơn hàng</h3>
                <div className="space-y-3">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${index === (order.statusHistory?.length ?? 0) - 1 ? 'bg-primary' : 'bg-neutral-300'}`} />
                      <div>
                        <p className="font-medium text-sm">
                          {statusLabels[history.status] || history.status}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(history.date).toLocaleString('vi-VN')}
                        </p>
                        {history.note && (
                          <p className="text-xs text-neutral-600 mt-0.5">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Sản phẩm ({order.items?.length || 0})</h3>
              <div className="space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <img
                      src={getImageUrl(item.image || item.product?.images?.[0] || '')}
                      alt={item.name || 'Sản phẩm'}
                      className="w-14 h-14 object-cover rounded-lg bg-neutral-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name || item.product?.name}</p>
                      <p className="text-sm text-neutral-500">
                        SL: {item.quantity} × {(item.price || 0).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      {((item.quantity || 0) * (item.price || 0)).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <HiOutlineLocationMarker className="w-5 h-5 text-primary" />
                Địa chỉ giao hàng
              </h3>
              {order.shippingAddress && (
                <div className="bg-neutral-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p className="text-neutral-600">{order.shippingAddress.phone}</p>
                  <p className="text-neutral-600">
                    {order.shippingAddress.address}
                    {order.shippingAddress.ward && `, ${order.shippingAddress.ward}`}
                    {order.shippingAddress.district && `, ${order.shippingAddress.district}`}
                    {(order.shippingAddress.province || order.shippingAddress.city) &&
                      `, ${order.shippingAddress.province || order.shippingAddress.city}`}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-neutral-500">Phương thức thanh toán</p>
                <p className="font-medium">
                  {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Trạng thái thanh toán</p>
                <p className={`font-medium ${paymentStatusColors[order.paymentStatus || 'pending']}`}>
                  {paymentStatusLabels[order.paymentStatus || 'pending']}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-neutral-50 rounded-xl p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tạm tính</span>
                  <span>{(order.subtotal || 0).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Phí giao hàng</span>
                  <span>
                    {(order.shippingCost || 0) === 0
                      ? 'Miễn phí'
                      : `${(order.shippingCost || 0).toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{(order.total || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Có thắc mắc? Liên hệ Hotline: {' '}
                <a href="tel:0839477199" className="text-primary font-medium">0839 477 199</a>
              </p>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!order && !isLoading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-medium mb-3">Cần hỗ trợ?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Nếu bạn không nhớ mã đơn hàng hoặc cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi:
            </p>
            <div className="space-y-2">
              <a
                href="tel:0839477199"
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <HiOutlinePhone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Hotline</p>
                  <p className="text-sm text-neutral-600">0839 477 199</p>
                </div>
              </a>
              <a
                href="https://zalo.me/0944600344"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">Z</span>
                </div>
                <div>
                  <p className="font-medium">Zalo</p>
                  <p className="text-sm text-neutral-600">Chat với shop qua Zalo</p>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="font-heading text-xl mb-2">Xác Nhận Hủy Đơn Hàng</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Bạn có chắc chắn muốn hủy đơn hàng <strong className="text-primary">{order?.orderCode || order?._id}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">
                Lý do hủy (không bắt buộc)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={3}
                className="input"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelReason('');
                }}
                className="btn btn-secondary flex-1"
                disabled={isCancelling}
              >
                Quay Lại
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {isCancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang hủy...
                  </span>
                ) : (
                  'Xác Nhận Hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
