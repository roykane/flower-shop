import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { ordersAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const paymentLabels: Record<string, string> = {
  pending: 'Chờ TT',
  paid: 'Đã TT',
  failed: 'Thất bại',
  refunded: 'Hoàn tiền',
};

const paymentColors: Record<string, string> = {
  pending: 'text-amber-600',
  paid: 'text-emerald-600',
  failed: 'text-red-600',
  refunded: 'text-neutral-600',
};

const paymentMethodLabels: Record<string, string> = {
  cod: 'COD',
  bank_transfer: 'CK',
  momo: 'MoMo',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [filterPendingProof, setFilterPendingProof] = useState(false);

  const getOrderCode = (order: Order) => order.orderCode || `#${order._id.slice(-6).toUpperCase()}`;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await ordersAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const orderCode = getOrderCode(o).toLowerCase();
    const matchesSearch =
      orderCode.includes(searchQuery.toLowerCase()) ||
      o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.shippingAddress?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.shippingAddress?.phone || '').includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
    const matchesPayment = filterPayment === 'all' || o.paymentStatus === filterPayment;
    const matchesPendingProof = !filterPendingProof || ((o as any).paymentProof?.image && !(o as any).paymentProof?.verifiedAt);
    return matchesSearch && matchesStatus && matchesPayment && matchesPendingProof;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await ordersAPI.updateStatus(orderId, newStatus);
      if (response.data.success) {
        setOrders(orders.map(o =>
          o._id === orderId ? { ...o, orderStatus: newStatus as Order['orderStatus'] } : o
        ));
        toast.success('Cập nhật thành công');
      }
    } catch (error) {
      toast.error('Lỗi cập nhật');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      const response = await ordersAPI.updatePaymentStatus(orderId, newPaymentStatus);
      if (response.data.success) {
        setOrders(orders.map(o =>
          o._id === orderId ? { ...o, paymentStatus: newPaymentStatus as Order['paymentStatus'] } : o
        ));
        toast.success('Cập nhật thành công');
      }
    } catch (error) {
      toast.error('Lỗi cập nhật');
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    setIsVerifying(true);
    try {
      const response = await ordersAPI.verifyPayment(orderId);
      if (response.data.success) {
        const updatedOrder = response.data.data;
        setOrders(orders.map(o =>
          o._id === orderId ? { ...o, ...updatedOrder } : o
        ));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...updatedOrder });
        }
        toast.success('Đã xác nhận thanh toán!');
        setShowPaymentProof(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xác nhận thanh toán');
    } finally {
      setIsVerifying(false);
    }
  };

  // Stats counts
  const statsCounts = {
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    shipped: orders.filter(o => o.orderStatus === 'shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    unpaid: orders.filter(o => o.paymentStatus === 'pending').length,
    pendingProof: orders.filter(o => (o as any).paymentProof?.image && !(o as any).paymentProof?.verifiedAt).length,
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-neutral-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Đơn Hàng</h1>
            <span className="text-sm text-neutral-500">({filteredOrders.length})</span>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-1 rounded ${filterStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'hover:bg-neutral-100'}`}
            >
              Chờ: <strong>{statsCounts.pending}</strong>
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              className={`px-2 py-1 rounded ${filterStatus === 'processing' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-neutral-100'}`}
            >
              Xử lý: <strong>{statsCounts.processing}</strong>
            </button>
            <button
              onClick={() => setFilterStatus('shipped')}
              className={`px-2 py-1 rounded ${filterStatus === 'shipped' ? 'bg-purple-100 text-purple-700' : 'hover:bg-neutral-100'}`}
            >
              Giao: <strong>{statsCounts.shipped}</strong>
            </button>
            <button
              onClick={() => setFilterPayment('pending')}
              className={`px-2 py-1 rounded ${filterPayment === 'pending' ? 'bg-red-100 text-red-700' : 'hover:bg-neutral-100'}`}
            >
              Chưa TT: <strong className="text-red-600">{statsCounts.unpaid}</strong>
            </button>
            {statsCounts.pendingProof > 0 && (
              <button
                onClick={() => setFilterPendingProof(!filterPendingProof)}
                className={`px-2 py-1 rounded flex items-center gap-1 ${filterPendingProof ? 'bg-green-100 text-green-700' : 'hover:bg-neutral-100'}`}
              >
                💳 <strong className="text-green-600">{statsCounts.pendingProof}</strong>
              </button>
            )}
            {(filterStatus !== 'all' || filterPayment !== 'all' || filterPendingProof) && (
              <button
                onClick={() => { setFilterStatus('all'); setFilterPayment('all'); setFilterPendingProof(false); }}
                className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border ${showFilters ? 'bg-primary text-white border-primary' : 'hover:bg-neutral-100'}`}
            >
              <HiOutlineFilter className="w-4 h-4" />
            </button>
            <button
              onClick={fetchOrders}
              className="p-1.5 rounded-lg border hover:bg-neutral-100"
              title="Làm mới"
            >
              <HiOutlineRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Hoàn tiền</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table - Compact */}
      <div className="flex-1 overflow-auto">
        {filteredOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10">
              <tr className="text-left text-xs text-neutral-500 uppercase">
                <th className="px-3 py-2 font-medium">Mã đơn</th>
                <th className="px-3 py-2 font-medium">Khách hàng</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Ngày</th>
                <th className="px-3 py-2 font-medium">SP</th>
                <th className="px-3 py-2 font-medium text-right">Tổng</th>
                <th className="px-3 py-2 font-medium">TT</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => {
                const status = order.orderStatus;
                const isUrgent = status === 'pending' && order.paymentStatus === 'paid';
                const hasPaymentProof = (order as any).paymentProof?.image && !(order as any).paymentProof?.verifiedAt;

                return (
                  <tr
                    key={order._id}
                    className={`hover:bg-neutral-50 cursor-pointer ${isUrgent ? 'bg-amber-50' : ''} ${hasPaymentProof ? 'bg-green-50' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order Code */}
                    <td className="px-3 py-2">
                      <span className="font-medium text-primary">{getOrderCode(order)}</span>
                      {(order as any).isGuest && (
                        <span className="ml-1 text-[10px] bg-neutral-200 text-neutral-600 px-1 rounded">Guest</span>
                      )}
                      {hasPaymentProof && (
                        <span className="ml-1 text-[10px] bg-green-500 text-white px-1 rounded animate-pulse" title="Có ảnh xác nhận CK">💳</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2">
                      <div className="max-w-[150px]">
                        <p className="font-medium truncate">{order.shippingAddress?.fullName || 'N/A'}</p>
                        <p className="text-xs text-neutral-500">{order.shippingAddress?.phone || ''}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2 hidden md:table-cell text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </td>

                    {/* Items count */}
                    <td className="px-3 py-2 text-center text-neutral-600">
                      {order.items?.length || 0}
                    </td>

                    {/* Total */}
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                      {(order.total / 1000).toFixed(0)}k
                      <span className="text-[10px] text-neutral-400 ml-0.5">
                        {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.paymentStatus || 'pending'}
                        onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                        className={`text-xs font-medium bg-transparent border-0 cursor-pointer p-0 ${paymentColors[order.paymentStatus || 'pending']}`}
                      >
                        <option value="pending">Chờ TT</option>
                        <option value="paid">Đã TT</option>
                        <option value="failed">Thất bại</option>
                        <option value="refunded">Hoàn tiền</option>
                      </select>
                    </td>

                    {/* Order Status */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border cursor-pointer ${statusColors[status] || 'bg-gray-100'}`}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="p-1 hover:bg-neutral-200 rounded"
                      >
                        <HiOutlineEye className="w-4 h-4 text-neutral-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-64 text-neutral-500">
            {orders.length === 0 ? 'Chưa có đơn hàng' : 'Không tìm thấy đơn hàng'}
          </div>
        )}
      </div>

      {/* Order Detail Modal - Wide Layout */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-violet/10 px-5 py-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-primary">{getOrderCode(selectedOrder)}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.orderStatus]}`}>
                  {statusLabels[selectedOrder.orderStatus]}
                </span>
                <span className={`text-xs font-medium ${paymentColors[selectedOrder.paymentStatus || 'pending']}`}>
                  {paymentLabels[selectedOrder.paymentStatus || 'pending']}
                </span>
                {(selectedOrder as any).isGuest && (
                  <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">Guest</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-white/50 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - 3 Columns */}
            <div className="grid grid-cols-3 divide-x">
              {/* Column 1: Customer Info */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Khách hàng</h3>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">
                      {selectedOrder.shippingAddress?.fullName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800">{selectedOrder.shippingAddress?.fullName}</p>
                    <a
                      href={`tel:${selectedOrder.shippingAddress?.phone}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <HiOutlinePhone className="w-3.5 h-3.5" />
                      {selectedOrder.shippingAddress?.phone}
                    </a>
                  </div>
                </div>

                <div className="text-sm text-neutral-600 flex items-start gap-2 bg-neutral-50 rounded-lg p-2.5">
                  <HiOutlineLocationMarker className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs leading-relaxed">
                    {selectedOrder.shippingAddress?.address}
                    {selectedOrder.shippingAddress?.ward && `, ${selectedOrder.shippingAddress.ward}`}
                    {selectedOrder.shippingAddress?.district && `, ${selectedOrder.shippingAddress.district}`}
                    {(selectedOrder.shippingAddress?.province || selectedOrder.shippingAddress?.city) &&
                      `, ${selectedOrder.shippingAddress?.province || selectedOrder.shippingAddress?.city}`}
                  </span>
                </div>

                {/* Notes */}
                {(selectedOrder.note || (selectedOrder as any).giftMessage) && (
                  <div className="mt-3 bg-amber-50 rounded-lg p-2.5 text-xs">
                    {(selectedOrder as any).giftMessage && (
                      <p className="mb-1">
                        <span className="font-medium text-amber-700">Thiệp:</span> {(selectedOrder as any).giftMessage}
                      </p>
                    )}
                    {selectedOrder.note && (
                      <p>
                        <span className="font-medium text-amber-700">Ghi chú:</span> {selectedOrder.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Contact Actions */}
                <div className="flex gap-2 mt-4">
                  <a
                    href={`tel:${selectedOrder.shippingAddress?.phone}`}
                    className="flex-1 text-xs py-2 px-3 border border-neutral-300 rounded-lg flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-colors"
                  >
                    <HiOutlinePhone className="w-3.5 h-3.5" />
                    Gọi
                  </a>
                  <a
                    href={`https://zalo.me/${selectedOrder.shippingAddress?.phone?.replace(/[\s.-]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs py-2 px-3 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-600 transition-colors"
                  >
                    <span className="font-bold">Z</span>
                    Zalo
                  </a>
                </div>
              </div>

              {/* Column 2: Products */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Sản phẩm ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item: any, index) => (
                    <div key={index} className="flex gap-2 items-center bg-neutral-50 rounded-lg p-2">
                      {(item.image || item.product?.images?.[0]) ? (
                        <img
                          src={getImageUrl(item.image || item.product?.images?.[0])}
                          alt=""
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-200 rounded flex items-center justify-center text-neutral-400 text-xs">
                          ?
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name || item.product?.name}</p>
                        <p className="text-xs text-neutral-500">
                          {item.quantity} × {(item.price || 0).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary whitespace-nowrap">
                        {((item.quantity || 0) * (item.price || 0)).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Summary & Actions */}
              <div className="p-4 bg-neutral-50/50">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Thanh toán</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tạm tính</span>
                    <span>{(selectedOrder.subtotal || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phí giao</span>
                    <span>
                      {(selectedOrder.shippingCost || 0) === 0
                        ? <span className="text-green-600">Miễn phí</span>
                        : `${(selectedOrder.shippingCost || 0).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-500 text-xs">
                    <span>Thanh toán</span>
                    <span>{paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{selectedOrder.total.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {/* Payment Proof Section */}
                {['bank_transfer', 'momo'].includes(selectedOrder.paymentMethod) && (
                  <div className="mb-4">
                    {(selectedOrder as any).paymentProof?.image ? (
                      <div className="bg-white rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                            <HiOutlinePhotograph className="w-4 h-4" />
                            Ảnh xác nhận CK
                          </span>
                          {(selectedOrder as any).paymentProof?.verifiedAt ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <HiOutlineCheckCircle className="w-4 h-4" />
                              Đã duyệt
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600">Chờ duyệt</span>
                          )}
                        </div>

                        {/* Show/Hide payment proof */}
                        {showPaymentProof ? (
                          <div className="relative">
                            <img
                              src={getImageUrl((selectedOrder as any).paymentProof.image)}
                              alt="Payment proof"
                              className="w-full rounded-lg border"
                            />
                            <button
                              onClick={() => setShowPaymentProof(false)}
                              className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowPaymentProof(true)}
                            className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30 flex items-center justify-center gap-1"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                            Xem ảnh xác nhận
                          </button>
                        )}

                        {/* Verify button - only show if not verified yet */}
                        {!(selectedOrder as any).paymentProof?.verifiedAt && selectedOrder.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => handleVerifyPayment(selectedOrder._id)}
                            disabled={isVerifying}
                            className="w-full mt-2 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isVerifying ? (
                              <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Đang duyệt...
                              </>
                            ) : (
                              <>
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                Duyệt thanh toán
                              </>
                            )}
                          </button>
                        )}

                        {/* Uploaded time */}
                        {(selectedOrder as any).paymentProof?.uploadedAt && (
                          <p className="text-[10px] text-neutral-400 mt-2 text-center">
                            Gửi lúc: {new Date((selectedOrder as any).paymentProof.uploadedAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-700">
                          <strong>Chưa có ảnh xác nhận</strong><br />
                          Khách hàng chưa gửi ảnh chuyển khoản
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Controls */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Trạng thái đơn</label>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipped">Đang giao</option>
                      <option value="delivered">Đã giao</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Thanh toán</label>
                    <select
                      value={selectedOrder.paymentStatus || 'pending'}
                      onChange={(e) => handlePaymentStatusChange(selectedOrder._id, e.target.value)}
                      className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="pending">Chờ thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="failed">Thất bại</option>
                      <option value="refunded">Hoàn tiền</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
