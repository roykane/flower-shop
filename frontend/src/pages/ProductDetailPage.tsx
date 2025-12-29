import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineShare, HiMinus, HiPlus, HiStar } from 'react-icons/hi';
import { Product } from '@/types';
import { useCartStore, useFavoritesStore } from '@/store/useStore';
import { productsAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import toast from 'react-hot-toast';
import SEO from '@/components/SEO';
import ProductReviews from '@/components/ProductReviews';

export default function ProductDetailPage() {
  const { slug } = useParams(); // slug có thể là ID hoặc slug
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();
  const { items: favorites, addToFavorites, removeFromFavorites } = useFavoritesStore();

  const isFavorite = product ? favorites.some(item => item._id === product._id) : false;

  const handleToggleFavorite = () => {
    if (!product) return;
    if (isFavorite) {
      removeFromFavorites(product._id);
      toast.success('Đã xóa khỏi yêu thích', { icon: '💔' });
    } else {
      addToFavorites(product);
      toast.success('Đã thêm vào yêu thích', { icon: '❤️' });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const response = await productsAPI.getById(slug);
        if (response.data.success) {
          // API trả về { product: {...}, related: [...] }
          const productData = response.data.data.product || response.data.data;
          setProduct(productData);

          // Sử dụng related products từ API nếu có
          if (response.data.data.related) {
            setRelatedProducts(response.data.data.related);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    setSelectedImage(0);
    setQuantity(1);
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.name,
      text: `${product.name} - ${(product.price || 0).toLocaleString('vi-VN')}đ`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết!', { icon: '📋' });
      }
    } catch (error) {
      // User cancelled or error
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết!', { icon: '📋' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 px-3 md:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="aspect-square max-h-[350px] bg-neutral-200 rounded-xl" />
            <div className="space-y-3">
              <div className="h-5 bg-neutral-200 rounded w-20" />
              <div className="h-6 bg-neutral-200 rounded w-3/4" />
              <div className="h-8 bg-neutral-200 rounded w-1/3" />
              <div className="h-16 bg-neutral-200 rounded" />
              <div className="h-10 bg-neutral-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-10 px-4 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-heading mb-4">Không Tìm Thấy Sản Phẩm</h1>
        <p className="text-neutral-500 mb-8">Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/products" className="btn btn-primary">
          Xem Tất Cả Sản Phẩm
        </Link>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? product.category.name : '';
  const categorySlug = typeof product.category === 'object' ? product.category.slug : '';
  const productImage = product.images?.[0] ? getImageUrl(product.images[0]) : undefined;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description || `${product.name} - ${(product.price || 0).toLocaleString('vi-VN')}đ. Mua ngay tại MINH ANH - Mâm Quả & Hoa Cưới An Giang.`}
        keywords={`${product.name}, ${categoryName}, mâm quả, hoa cưới, an giang, minh anh`}
        image={productImage}
        url={`/products/${product.slug || product._id}`}
        type="product"
        product={{
          name: product.name,
          price: product.price || 0,
          image: productImage || '',
          description: product.description || product.name,
          availability: (product.stock || 0) > 0 ? 'InStock' : 'OutOfStock',
          category: categoryName,
        }}
      />
    <div className="py-4 px-3 md:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb - ẩn trên mobile */}
        <nav className="hidden md:flex items-center gap-2 text-xs text-neutral-500 mb-4">
          <Link to="/" className="hover:text-primary">Trang Chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">Sản Phẩm</Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link to={`/${categorySlug}`} className="hover:text-primary">
                {categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-800 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Hình ảnh */}
          <div className="md:sticky md:top-4 self-start">
            <div className="aspect-square max-h-[350px] md:max-h-[400px] rounded-xl overflow-hidden bg-neutral-100 mb-2">
              {product.images && product.images.length > 0 ? (
                <img
                  src={getImageUrl(product.images[selectedImage] || product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                  Không có hình ảnh
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div className="space-y-3">
            {categoryName && (
              <Link
                to={`/${categorySlug}`}
                className="inline-block text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded-full"
              >
                {categoryName}
              </Link>
            )}

            <h1 className="font-heading text-xl md:text-2xl leading-tight">{product.name}</h1>

            {/* Đánh giá + Giá cùng hàng */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-2xl font-bold text-primary">
                {(product.price || 0).toLocaleString('vi-VN')}đ
              </p>
              {product.averageRating !== undefined && product.averageRating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.averageRating!) ? 'fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-neutral-500">({product.totalReviews || 0})</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3 md:line-clamp-none">
                {product.description}
              </p>
            )}

            {/* Số lượng + Tồn kho */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex items-center border border-neutral-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-neutral-50"
                >
                  <HiMinus className="w-4 h-4" />
                </button>
                <span className="px-3 font-medium text-sm min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                  className="p-2 hover:bg-neutral-50"
                >
                  <HiPlus className="w-4 h-4" />
                </button>
              </div>
              <span className={`text-xs ${(product.stock || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {(product.stock || 0) > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock === 0}
                className="flex-1 btn btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(product.stock || 0) > 0 ? 'Thêm Vào Giỏ' : 'Hết Hàng'}
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`btn px-3 transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                    : 'btn-secondary hover:border-rose-300 hover:text-rose-500'
                }`}
                title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                {isFavorite ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
              </button>
              <button onClick={handleShare} className="btn btn-secondary px-3" title="Chia sẻ">
                <HiOutlineShare className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin thêm - compact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span className="flex items-center gap-1">🚚 Freeship từ 750K</span>
              <span className="flex items-center gap-1">🌸 Hoa tươi 100%</span>
              <span className="flex items-center gap-1">💝 Gói quà free</span>
            </div>
          </div>
        </div>

        {/* Đánh giá sản phẩm */}
        <ProductReviews productId={product._id} />

        {/* Sản phẩm liên quan */}
        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="font-heading text-lg md:text-xl mb-4">Có Thể Bạn Sẽ Thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map(item => (
                <Link key={item._id} to={`/products/${item._id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-neutral-100">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                        Không có hình
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-neutral-800 group-hover:text-primary transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-primary text-sm font-semibold">{(item.price || 0).toLocaleString('vi-VN')}đ</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
