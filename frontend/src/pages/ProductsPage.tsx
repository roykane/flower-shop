import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineSearch, HiX, HiViewGrid, HiViewList, HiOutlineStar, HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { Product, Category } from '@/types';
import { useCartStore, useFavoritesStore } from '@/store/useStore';
import { productsAPI, categoriesAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import toast from 'react-hot-toast';

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-low', label: 'Giá thấp' },
  { value: 'price-high', label: 'Giá cao' },
  { value: 'popular', label: 'Phổ biến' },
];

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addItem } = useCartStore();
  const { items: favorites, addToFavorites, removeFromFavorites } = useFavoritesStore();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response.data.success) setCategories(response.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory !== 'all') {
          // Backend expects category slug, not ID
          const categorySlug = categories.find(c => c._id === selectedCategory)?.slug;
          if (categorySlug) params.category = categorySlug;
        }
        const response = await productsAPI.getAll(params);
        if (response.data.success) setProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, categories]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && categories.length > 0) {
      const found = categories.find(c => c.slug === category);
      if (found) setSelectedCategory(found._id);
    }
  }, [searchParams, categories]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'popular': return (b.averageRating || 0) - (a.averageRating || 0);
      default: return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
  });

  const isFavorite = (productId: string) => favorites.some(item => item._id === productId);

  const selectedCategoryName = categories.find(c => c._id === selectedCategory)?.name || 'Tất cả';

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Header with Gradient Mesh */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-violet/10 rounded-full blur-3xl" />

        <div className="container-custom py-12 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-violet" />
              <span className="text-sm font-semibold tracking-wider uppercase text-gradient">MINH ANH</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-neutral-900 font-semibold mb-3">
              Bộ Sưu Tập <span className="text-gradient">Sản Phẩm</span>
            </h1>
            <p className="text-neutral-600 max-w-lg mx-auto">
              Mâm quả cưới, giỏ quà tết, giỏ trái cây, hoa cưới và quà tặng cho mọi dịp đặc biệt
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search & Filter Bar */}
        <div className="glass rounded-2xl p-4 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm yêu thích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-white border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <HiX className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white border border-neutral-200 cursor-pointer hover:border-primary transition-colors focus:ring-2 focus:ring-primary/20"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <div className="hidden lg:flex items-center gap-1 bg-white rounded-xl border border-neutral-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100'}`}
                >
                  <HiViewGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100'}`}
                >
                  <HiViewList className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-3 rounded-xl bg-white border border-neutral-200 hover:border-primary transition-colors"
              >
                <HiOutlineAdjustments className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur-xl p-6 overflow-auto' : 'hidden'} lg:block lg:relative lg:w-56 lg:shrink-0`}>
            {showFilters && (
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="font-heading text-xl font-semibold">Bộ Lọc</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="glass rounded-2xl p-5 sticky top-4">
              <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-primary to-violet" />
                Danh Mục
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory('all'); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                      : 'hover:bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((cat, i) => (
                  <button
                    key={cat._id}
                    onClick={() => { setSelectedCategory(cat._id); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all animate-slide-up ${
                      selectedCategory === cat._id
                        ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                        : 'hover:bg-neutral-100 text-neutral-600'
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <hr className="my-5 border-neutral-200" />

              <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-secondary to-violet" />
                Khoảng Giá
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Dưới 500K', value: '0-500' },
                  { label: '500K - 1 triệu', value: '500-1000' },
                  { label: 'Trên 1 triệu', value: '1000+' }
                ].map((p) => (
                  <label key={p.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-neutral-300 text-primary focus:ring-primary/50 transition-colors"
                    />
                    <span className="text-sm text-neutral-600 group-hover:text-neutral-800 transition-colors">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-neutral-600">
                <strong className="text-neutral-900">{sortedProducts.length}</strong> sản phẩm
                {selectedCategory !== 'all' && (
                  <> trong <span className="text-primary font-semibold">{selectedCategoryName}</span></>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square skeleton mb-3" />
                    <div className="h-5 skeleton w-3/4 mb-2" />
                    <div className="h-5 skeleton w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {sortedProducts.map((product, i) => (
                  <div
                    key={product._id}
                    className={`product-card group animate-scale-in relative ${viewMode === 'list' ? 'flex gap-5' : ''}`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    {/* Favorite Button - Outside Link */}
                    <button
                      onClick={() => {
                        if (isFavorite(product._id)) {
                          removeFromFavorites(product._id);
                          toast.success(`Đã xóa ${product.name} khỏi yêu thích`);
                        } else {
                          addToFavorites(product);
                          toast.success(`Đã thêm ${product.name} vào yêu thích`);
                        }
                      }}
                      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isFavorite(product._id)
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white/90 backdrop-blur-sm text-neutral-500 hover:bg-primary hover:text-white shadow-md'
                      }`}
                    >
                      {isFavorite(product._id) ? (
                        <HiHeart className="w-5 h-5" />
                      ) : (
                        <HiOutlineHeart className="w-5 h-5" />
                      )}
                    </button>

                    {/* Add to Cart Button - Outside Link */}
                    {product.stock > 0 && (
                      <button
                        onClick={() => {
                          addItem(product, 1);
                          toast.success(`Đã thêm ${product.name} vào giỏ!`);
                        }}
                        className="absolute bottom-[4.5rem] right-3 z-10 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110"
                      >
                        <span className="text-xl font-medium">+</span>
                      </button>
                    )}

                    <Link to={`/products/${product._id}`} className="block">
                      <div className={`product-card-image ${viewMode === 'list' ? 'w-32 shrink-0' : ''}`}>
                        <img src={getImageUrl(product.images?.[0] || '')} alt={product.name} />
                        {product.isFeatured && (
                          <span className="absolute top-3 left-3 badge badge-accent badge-glow">
                            <HiOutlineStar className="w-3 h-3 mr-1" /> Hot
                          </span>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-sm text-neutral-600 font-medium px-4 py-2 rounded-full bg-neutral-100">Hết hàng</span>
                          </div>
                        )}
                      </div>
                      <div className={`product-card-body ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center py-3' : ''}`}>
                        <h3 className="product-card-title">{product.name}</h3>
                        {viewMode === 'list' && product.description && (
                          <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{product.description}</p>
                        )}
                        <p className="product-card-price">{(product.price || 0).toLocaleString('vi-VN')}d</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass rounded-3xl">
                <div className="text-6xl mb-6 animate-bounce-soft">🌸</div>
                <h3 className="font-heading text-2xl mb-3">Không tìm thấy sản phẩm</h3>
                <p className="text-neutral-500 mb-6">Hãy thử tìm kiếm với từ khóa khác</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="btn btn-gradient"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
