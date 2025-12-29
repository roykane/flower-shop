import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingBag, HiOutlineTrash } from 'react-icons/hi';
import { useFavoritesStore, useCartStore } from '@/store/useStore';
import { getImageUrl } from '@/utils/helpers';
import { Product } from '@/types';
import toast from 'react-hot-toast';

const getCategoryName = (product: Product) => {
  if (!product.category) return '';
  if (typeof product.category === 'object' && product.category.name) {
    return product.category.name;
  }
  return '';
};

export default function FavoritesPage() {
  const { items, removeFromFavorites, clearFavorites } = useFavoritesStore();
  const { addToCart } = useCartStore();

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const handleRemove = (productId: string, productName: string) => {
    removeFromFavorites(productId);
    toast.success(`Đã xóa ${productName} khỏi danh sách yêu thích`);
  };

  if (items.length === 0) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-6xl mb-6">
            <HiOutlineHeart className="w-24 h-24 mx-auto text-neutral-300" />
          </div>
          <h1 className="font-heading text-3xl mb-4">Danh Sách Yêu Thích Trống</h1>
          <p className="text-neutral-500 mb-8">
            Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.
          </p>
          <Link to="/products" className="btn btn-primary">
            Khám Phá Sản Phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl flex items-center gap-3">
            <HiHeart className="w-8 h-8 text-primary" />
            Yêu Thích ({items.length} sản phẩm)
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => {
                clearFavorites();
                toast.success('Đã xóa tất cả sản phẩm yêu thích');
              }}
              className="text-sm text-neutral-500 hover:text-red-500 transition-colors"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map(product => (
            <div
              key={product._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <Link to={`/products/${product._id}`} className="block relative aspect-square">
                <img
                  src={getImageUrl(product.images?.[0] || '')}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.salePrice && product.salePrice < product.price && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg">
                      -{Math.round((1 - product.salePrice / product.price) * 100)}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-lg">
                      Mới
                    </span>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(product._id, product.name);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </Link>

              {/* Info */}
              <div className="p-4">
                {getCategoryName(product) && (
                  <p className="text-xs text-neutral-500 mb-1">{getCategoryName(product)}</p>
                )}
                <Link
                  to={`/products/${product._id}`}
                  className="font-medium text-neutral-800 hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]"
                >
                  {product.name}
                </Link>

                <div className="flex items-center justify-between mt-3">
                  <div>
                    {product.salePrice && product.salePrice < product.price ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {product.salePrice.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-sm text-neutral-400 line-through">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-primary">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full mt-3 py-2.5 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-violet text-white text-sm font-medium rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <HiOutlineShoppingBag className="w-4 h-4" />
                  {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Continue shopping */}
        <div className="text-center mt-10">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
