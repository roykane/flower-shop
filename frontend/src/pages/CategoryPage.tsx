import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiHeart,
  HiOutlineEye,
  HiX,
  HiPlus,
  HiMinus,
} from 'react-icons/hi';
import { Product, Category } from '@/types';
import { useCartStore, useFavoritesStore } from '@/store/useStore';
import { categoriesAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import toast from 'react-hot-toast';
import SEO from '@/components/SEO';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { addItem } = useCartStore();
  const { items: favoriteItems, addToFavorites, removeFromFavorites } = useFavoritesStore();

  const isFavorite = (productId: string) => favoriteItems.some(item => item._id === productId);

  const toggleFavorite = (product: Product) => {
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
      toast.success('Đã xóa khỏi yêu thích');
    } else {
      addToFavorites(product);
      toast.success('Đã thêm vào yêu thích');
    }
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const categoriesResponse = await categoriesAPI.getAll();
        if (categoriesResponse.data.success) {
          const categories = categoriesResponse.data.data;
          const foundCategory = categories.find((c: Category) => c.slug === slug);

          if (foundCategory) {
            setCategory(foundCategory);
            const productsResponse = await categoriesAPI.getProducts(foundCategory._id);
            if (productsResponse.data.success) {
              setProducts(productsResponse.data.data);
            }
          } else {
            setCategory(null);
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        setCategory(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    addItem(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  if (isLoading) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-neutral-200 rounded-2xl mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-square bg-neutral-200 rounded-xl mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-10 px-4 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="font-heading text-3xl mb-4">Không Tìm Thấy Danh Mục</h1>
        <p className="text-neutral-500 mb-8">
          Danh mục bạn đang tìm không tồn tại.
        </p>
        <Link to="/products" className="btn btn-primary">
          Xem Tất Cả Sản Phẩm
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={category.name}
        description={category.description || `${category.name} - Đa dạng mẫu mã, giá cả hợp lý. Mua ngay tại MINH ANH - Mâm Quả & Hoa Cưới An Giang.`}
        keywords={`${category.name}, mâm quả, hoa cưới, an giang, minh anh, ${category.slug}`}
        image={getImageUrl(category.image)}
        url={`/${category.slug}`}
      />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Banner */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={getImageUrl(category.image)}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
          <div className="absolute bottom-8 left-8 text-white">
            <nav className="text-sm text-white/80 mb-2">
              <Link to="/" className="hover:text-white">Trang Chủ</Link>
              {' / '}
              <Link to="/products" className="hover:text-white">Sản Phẩm</Link>
              {' / '}
              <span>{category.name}</span>
            </nav>
            <h1 className="font-heading text-4xl mb-2 text-white">{category.name}</h1>
            <p className="text-white/80 max-w-lg">{category.description}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl">
            {sortedProducts.length} Sản Phẩm
          </h2>
          <select
            className="input w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Sắp xếp: Nổi Bật</option>
            <option value="price-low">Giá: Thấp đến Cao</option>
            <option value="price-high">Giá: Cao đến Thấp</option>
            <option value="newest">Mới Nhất</option>
          </select>
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedProducts.map((product, index) => (
              <div
                key={product._id}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(product)}
                  className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isFavorite(product._id)
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'bg-white/90 backdrop-blur-sm text-stone-400 hover:bg-rose-500 hover:text-white shadow-md'
                  }`}
                >
                  {isFavorite(product._id) ? (
                    <HiHeart className="w-4 h-4" />
                  ) : (
                    <HiOutlineHeart className="w-4 h-4" />
                  )}
                </button>

                <Link to={`/products/${product._id}`} className="block">
                  {/* Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 mb-2 shadow-sm">
                    <img
                      src={getImageUrl(product.images?.[0] || '')}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isFeatured && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold rounded-md shadow">
                          HOT
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="px-2 py-0.5 bg-stone-800 text-white text-[10px] font-medium rounded-md">
                          Hết hàng
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    {product.stock > 0 && (
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setQuickViewProduct(product);
                          }}
                          className="w-9 h-9 rounded-lg bg-white shadow-lg flex items-center justify-center hover:bg-stone-50 transition-all hover:scale-110"
                          title="Xem nhanh"
                        >
                          <HiOutlineEye className="w-4 h-4 text-stone-700" />
                        </button>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-9 h-9 rounded-lg bg-rose-500 shadow-lg flex items-center justify-center hover:bg-rose-600 transition-all hover:scale-110"
                          title="Thêm vào giỏ"
                        >
                          <HiOutlineShoppingBag className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-medium text-stone-700 line-clamp-2 leading-snug mb-1 group-hover:text-rose-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-base font-bold text-rose-500">
                      {(product.price || 0).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-6xl mb-6">🌸</div>
            <h2 className="font-heading text-2xl mb-4">Chưa Có Sản Phẩm</h2>
            <p className="text-neutral-500 mb-8">
              Chúng tôi đang cập nhật sản phẩm cho danh mục này.
            </p>
            <Link to="/products" className="btn btn-primary">
              Xem Tất Cả Sản Phẩm
            </Link>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          getImageUrl={getImageUrl}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          isFavorite={isFavorite(quickViewProduct._id)}
          onToggleFavorite={() => toggleFavorite(quickViewProduct)}
        />
      )}
      </div>
    </>
  );
}

// Quick View Modal Component
interface QuickViewModalProps {
  product: Product;
  getImageUrl: (path: string) => string;
  onClose: () => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function QuickViewModal({ product, getImageUrl, onClose, onAddToCart, isFavorite, onToggleFavorite }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Images */}
          <div className="p-6 bg-stone-50">
            <div className="aspect-square rounded-xl overflow-hidden bg-white mb-4">
              <img
                src={getImageUrl(product.images?.[selectedImage] || '')}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-rose-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl font-heading mb-2">{product.name}</h2>
              <p className="text-2xl font-bold text-rose-500 mb-4">
                {(product.price || 0).toLocaleString('vi-VN')}₫
              </p>

              {product.description && (
                <p className="text-stone-600 text-sm mb-6 line-clamp-4">
                  {product.description}
                </p>
              )}

              {/* Stock status */}
              {product.stock > 0 ? (
                <p className="text-green-600 text-sm mb-6">
                  ✓ Còn {product.stock} sản phẩm
                </p>
              ) : (
                <p className="text-red-500 text-sm mb-6">✗ Hết hàng</p>
              )}

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-stone-700 mb-2 block">
                    Số lượng
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    >
                      <HiMinus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-medium w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    >
                      <HiPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onToggleFavorite}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white'
                    : 'border border-stone-200 text-stone-600 hover:border-rose-500 hover:text-rose-500'
                }`}
              >
                {isFavorite ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
              </button>
              {product.stock > 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <HiOutlineShoppingBag className="w-5 h-5" />
                  Thêm vào giỏ hàng
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 h-12 bg-stone-200 text-stone-500 rounded-xl font-medium cursor-not-allowed"
                >
                  Hết hàng
                </button>
              )}
            </div>

            {/* View detail link */}
            <Link
              to={`/products/${product._id}`}
              className="mt-4 text-center text-sm text-rose-500 hover:underline"
              onClick={onClose}
            >
              Xem chi tiết sản phẩm →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
