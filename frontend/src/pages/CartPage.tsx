import { Link } from 'react-router-dom';
import { HiMinus, HiPlus, HiOutlineTrash, HiArrowRight } from 'react-icons/hi';
import { useCartStore } from '@/store/useStore';
import { getImageUrl } from '@/utils/helpers';
import { Product } from '@/types';

const getCategoryName = (product: Product) => {
  if (!product.category) return '';
  if (typeof product.category === 'object' && product.category.name) {
    return product.category.name;
  }
  return '';
};

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();

  // Calculate totals from items to ensure accuracy
  const subtotal = items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
  const shipping = subtotal >= 750000 ? 0 : 30000;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="font-heading text-3xl mb-4">Giỏ Hàng Trống</h1>
          <p className="text-neutral-500 mb-8">
            Có vẻ như bạn chưa thêm hoa nào vào giỏ hàng.
          </p>
          <Link to="/products" className="btn btn-primary">
            Xem Sản Phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-3xl mb-8">Giỏ Hàng ({items.length} sản phẩm)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sản phẩm trong giỏ */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div
                key={item.product._id}
                className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm"
              >
                <Link to={`/products/${item.product._id}`}>
                  <img
                    src={getImageUrl(item.product.images?.[0] || '')}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-xl bg-neutral-100"
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/products/${item.product._id}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      {getCategoryName(item.product) && (
                        <p className="text-sm text-neutral-500">
                          {getCategoryName(item.product)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.product._id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-neutral-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="p-2 hover:bg-neutral-50"
                        disabled={item.quantity <= 1}
                      >
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="p-2 hover:bg-neutral-50"
                      >
                        <HiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-semibold text-primary">
                      {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="font-heading text-xl mb-6">Tóm Tắt Đơn Hàng</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính ({items.length} sản phẩm)</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Phí vận chuyển</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-primary">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="btn btn-primary w-full flex items-center justify-center gap-2">
                Tiến Hành Thanh Toán
                <HiArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-neutral-500 text-center mt-4">
                Miễn phí vận chuyển cho đơn hàng trên 750.000đ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
