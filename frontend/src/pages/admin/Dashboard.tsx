import { useState, useEffect } from 'react';
import { HiOutlineShoppingBag, HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineChartBar } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { ordersAPI, productsAPI } from '@/utils/api';
import { Order, Product } from '@/types';

const statusLabels: Record<string, string> = {
  pending: 'Chờ Xử Lý',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao',
  delivered: 'Đã Giao',
  cancelled: 'Đã Hủy',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          ordersAPI.getAll(),
          productsAPI.getAll(),
        ]);

        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data);
        }
        if (productsRes.data.success) {
          setProducts(productsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tính toán thống kê từ dữ liệu thật
  // Doanh thu chỉ tính từ đơn hàng ĐÃ GIAO (delivered)
  const deliveredOrdersList = orders.filter(o => o.orderStatus === 'delivered');
  const totalRevenue = deliveredOrdersList.reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const deliveredOrders = deliveredOrdersList.length;

  const stats = [
    {
      title: 'Tổng Doanh Thu',
      value: totalRevenue > 0 ? `${totalRevenue.toLocaleString('vi-VN')}đ` : '0đ',
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Tổng Đơn Hàng',
      value: totalOrders.toString(),
      icon: HiOutlineShoppingBag,
    },
    {
      title: 'Tổng Sản Phẩm',
      value: totalProducts.toString(),
      icon: HiOutlineChartBar,
    },
    {
      title: 'Đã Giao Thành Công',
      value: deliveredOrders.toString(),
      icon: HiOutlineUsers,
    },
  ];

  // Lấy 5 đơn hàng gần nhất
  const recentOrders = orders.slice(0, 5);

  // Lấy sản phẩm bán chạy (dựa trên số lượng bán)
  const topProducts = [...products]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-64" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-12 w-12 bg-neutral-200 rounded-lg mb-4" />
              <div className="h-8 bg-neutral-200 rounded w-24 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading">Bảng Điều Khiển</h1>
        <p className="text-neutral-500">Chào mừng trở lại! Dưới đây là tình hình cửa hàng.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-neutral-500">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-heading text-lg">Đơn Hàng Gần Đây</h2>
              <Link to="/admin/orders" className="text-primary text-sm hover:underline">
                Xem Tất Cả
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Mã ĐH</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Khách Hàng</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Ngày</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Tổng</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-neutral-500">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 text-sm font-medium">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {order.shippingAddress?.fullName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {order.total.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {statusLabels[order.orderStatus] || order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-heading text-lg">Sản Phẩm Bán Chạy</h2>
              <Link to="/admin/products" className="text-primary text-sm hover:underline">
                Xem Tất Cả
              </Link>
            </div>
            {topProducts.length > 0 ? (
              <div className="p-6 space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product._id} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-neutral-500">{product.soldCount || 0} đã bán</p>
                    </div>
                    <span className="font-medium text-primary">
                      {product.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm mt-6 p-6">
            <h2 className="font-heading text-lg mb-4">Thao Tác Nhanh</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/products/new" className="btn btn-primary text-center text-sm">
                Thêm Sản Phẩm
              </Link>
              <Link to="/admin/categories" className="btn btn-secondary text-center text-sm">
                Danh Mục
              </Link>
              <Link to="/admin/orders" className="btn btn-secondary text-center text-sm">
                Đơn Hàng
              </Link>
              <Link to="/admin/users" className="btn btn-secondary text-center text-sm">
                Người Dùng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
