import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineEye } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Order, Product } from '@/types';
import { ordersAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import { useAuthStore, useCartStore } from '@/store/useStore';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ Xử Lý',
  confirmed: 'Đã Xác Nhận',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao',
  delivered: 'Đã Giao',
  cancelled: 'Đã Hủy',
};

const paymentMethodLabels: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  credit_card: 'Thẻ tín dụng',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'text-yellow-600',
  paid: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-neutral-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  // Handle reorder - add all items from order to cart
  const handleReorder = (order: Order) => {
    // Clear cart first
    clearCart();

    // Add each item from order to cart
    order.items.forEach((item: any) => {
      // Construct a minimal product object from order item data
      const product: Product = {
        _id: item.product?._id || item.product || '',
        name: item.name || item.product?.name || 'Sản phẩm',
        slug: item.product?.slug || '',
        price: item.price || 0,
        images: item.image ? [item.image] : (item.product?.images || []),
        description: '',
        category: item.product?.category || '',
        stock: 999, // Assume in stock for reorder
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addItem(product, item.quantity || 1);
    });

    toast.success(`Đã thêm ${order.items.length} sản phẩm vào giỏ hàng!`);
    navigate('/cart');
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await ordersAPI.getMyOrders();
        if (response.data.success) {
          setOrders(response.data.data || []);
        }
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Không thể tải đơn hàng');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="font-heading text-2xl mb-4">Vui Lòng Đăng Nhập</h2>
            <p className="text-neutral-500 mb-8">
              Bạn cần đăng nhập để xem đơn hàng của mình.
            </p>
            <Link to="/login" className="btn btn-primary">
              Đăng Nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Đang tải
  if (isLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-3xl mb-8">Đơn Hàng Của Tôi</h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-32" />
                    <div className="h-3 bg-neutral-200 rounded w-24" />
                  </div>
                  <div className="h-6 bg-neutral-200 rounded w-20" />
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-lg" />
                  <div className="w-16 h-16 bg-neutral-200 rounded-lg" />
                </div>
                <div className="h-4 bg-neutral-200 rounded w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Lỗi
  if (error) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="font-heading text-2xl mb-4">Có Lỗi Xảy Ra</h2>
            <p className="text-neutral-500 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Thử Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl mb-8">Đơn Hàng Của Tôi</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="font-heading text-2xl mb-4">Chưa Có Đơn Hàng</h2>
            <p className="text-neutral-500 mb-8">
              Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm!
            </p>
            <Link to="/products" className="btn btn-primary">
              Xem Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-4">
                  {/* Product Images */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {order.items.slice(0, 2).map((item: any, index) => (
                      <img
                        key={index}
                        src={getImageUrl(item.image || item.product?.images?.[0] || '')}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg bg-neutral-100 border-2 border-white"
                      />
                    ))}
                    {order.items.length > 2 && (
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 border-2 border-white flex items-center justify-center text-xs text-neutral-500 font-medium">
                        +{order.items.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-primary">{order.orderCode || `#${order._id.slice(-8)}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.orderStatus || 'pending']}`}>
                        {statusLabels[order.orderStatus || 'pending']}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.items.length} sản phẩm
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary">{(order.total || 0).toLocaleString('vi-VN')}đ</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="text-xs text-neutral-500 hover:text-primary mt-0.5 flex items-center gap-1 ml-auto"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Chi Tiết Đơn Hàng - Wide Horizontal Layout */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-scaleIn">
              {/* Header */}
              <div className="px-4 py-3 md:px-6 md:py-4 border-b bg-gradient-to-r from-primary/5 to-violet/5 rounded-t-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-primary font-bold text-lg">{selectedOrder.orderCode || `#${selectedOrder._id.slice(-8)}`}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.orderStatus || 'pending']}`}>
                        {statusLabels[selectedOrder.orderStatus || 'pending']}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-white/50 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                {/* Column 1: Order Info + Shipping */}
                <div className="p-4 md:p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <p className="text-neutral-400 text-xs">Ngày đặt</p>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Ngày giao</p>
                      <p className="font-medium">
                        {selectedOrder.deliveryDate
                          ? new Date(selectedOrder.deliveryDate).toLocaleDateString('vi-VN')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Thanh toán</p>
                      <p className="font-medium text-xs">{paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Trạng thái TT</p>
                      <p className={`font-medium text-xs ${paymentStatusColors[selectedOrder.paymentStatus || 'pending']}`}>
                        {paymentStatusLabels[selectedOrder.paymentStatus || 'pending']}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <p className="text-xs text-neutral-400 mb-1">Địa chỉ giao hàng</p>
                    <p className="font-medium text-sm">{selectedOrder.shippingAddress?.fullName}</p>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {selectedOrder.shippingAddress?.address}
                      {selectedOrder.shippingAddress?.ward && `, ${selectedOrder.shippingAddress.ward}`}
                      {selectedOrder.shippingAddress?.district && `, ${selectedOrder.shippingAddress.district}`}
                      {(selectedOrder.shippingAddress?.province || selectedOrder.shippingAddress?.city) &&
                        `, ${selectedOrder.shippingAddress?.province || selectedOrder.shippingAddress?.city}`}
                    </p>
                    <p className="text-sm text-primary font-medium mt-1">{selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Column 2: Products + Summary */}
                <div className="p-4 md:p-5">
                  {/* Products */}
                  <p className="text-xs text-neutral-400 mb-2">Sản phẩm ({selectedOrder.items.length})</p>
                  <div className="space-y-2 mb-4">
                    {selectedOrder.items.map((item: any, index) => (
                      <div key={index} className="flex gap-3 items-start bg-neutral-50 rounded-lg p-2">
                        <img
                          src={getImageUrl(item.image || item.product?.images?.[0] || '')}
                          alt={item.name || item.product?.name || 'Sản phẩm'}
                          className="w-11 h-11 object-cover rounded-lg bg-neutral-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-snug">{item.name || item.product?.name || 'Sản phẩm'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {item.quantity} × {(item.price || 0).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-primary whitespace-nowrap flex-shrink-0">
                          {(item.quantity * (item.price || 0)).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Tạm tính</span>
                        <span>{(selectedOrder.subtotal || 0).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phí giao hàng</span>
                        <span>
                          {(selectedOrder.shippingCost || 0) === 0
                            ? <span className="text-green-600">Miễn phí</span>
                            : `${(selectedOrder.shippingCost || 0).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      {(selectedOrder.tax || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Thuế</span>
                          <span>{(selectedOrder.tax || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{(selectedOrder.total || 0).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {['delivered', 'cancelled'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => {
                        handleReorder(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="w-full mt-3 btn btn-primary text-sm"
                    >
                      Đặt Lại Đơn Hàng
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="mt-10 hidden">
          <div className="bg-gradient-to-r from-primary via-violet to-secondary rounded-3xl p-6 lg:p-8 shadow-xl shadow-primary/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-xl lg:text-2xl font-heading text-white mb-2">
                  Nhận Ưu Đãi Đặc Biệt
                </h3>
                <p className="text-white/80 text-sm">
                  Đăng ký để nhận thông tin về sản phẩm mới và khuyến mãi hấp dẫn
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-64"
                />
                <button className="px-5 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Đăng Ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
