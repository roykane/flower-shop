import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiArrowRight,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineGift,
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHeart,
  HiHeart
} from 'react-icons/hi';
import { Product, Category } from '@/types';
import { productsAPI, categoriesAPI, newsletterAPI } from '@/utils/api';
import { getImageUrl } from '@/utils/helpers';
import { useCartStore, useFavoritesStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import heroFlowers from '@/assets/images/hero-flowers.jpg';
import SEO from '@/components/SEO';
import FlashSale from '@/components/FlashSale';

// Default categories với icon và gradient
const defaultCategories = [
  { _id: '1', name: 'Mâm Quả Cưới', slug: 'mam-qua-cuoi', image: '', icon: '🎀', gradient: 'from-rose-400 to-pink-500' },
  { _id: '2', name: 'Giỏ Quà Tết', slug: 'gio-qua-tet', image: '', icon: '🧧', gradient: 'from-red-500 to-orange-500' },
  { _id: '3', name: 'Giỏ Trái Cây', slug: 'gio-trai-cay', image: '', icon: '🍎', gradient: 'from-green-400 to-emerald-500' },
  { _id: '4', name: 'Hoa Cưới', slug: 'hoa-cuoi', image: '', icon: '💐', gradient: 'from-pink-400 to-rose-500' },
  { _id: '5', name: 'Hoa Tươi', slug: 'hoa-tuoi', image: '', icon: '🌸', gradient: 'from-purple-400 to-violet-500' },
  { _id: '6', name: 'Quà Tặng', slug: 'qua-tang', image: '', icon: '🎁', gradient: 'from-amber-400 to-orange-500' },
];

// Quick filter options
const priceFilters = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Dưới 500K', value: '0-500000' },
  { label: '500K - 1Tr', value: '500000-1000000' },
  { label: '1Tr - 2Tr', value: '1000000-2000000' },
  { label: 'Trên 2Tr', value: '2000000-999999999' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const productSectionRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();
  const { items: favorites, addToFavorites, removeFromFavorites } = useFavoritesStore();

  const isFavorite = (productId: string) => favorites.some(item => item._id === productId);

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
      toast.success(`Đã xóa ${product.name} khỏi yêu thích`, { icon: '💔' });
    } else {
      addToFavorites(product);
      toast.success(`Đã thêm ${product.name} vào yêu thích`, { icon: '❤️' });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    setIsSubscribing(true);
    try {
      const response = await newsletterAPI.subscribe(newsletterEmail);
      if (response.data.success) {
        toast.success(response.data.message || 'Đăng ký thành công!');
        setNewsletterEmail('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ limit: 50 })
        ]);
        if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
        if (productsRes.data.success) {
          setFeaturedProducts(productsRes.data.data);
          setFilteredProducts(productsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter products based on search, category, and price
  useEffect(() => {
    let result = [...featuredProducts];
    
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category?.slug === selectedCategory);
    }
    
    if (selectedPrice !== 'all') {
      const [min, max] = selectedPrice.split('-').map(Number);
      result = result.filter(p => p.price >= min && p.price <= max);
    }
    
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, selectedPrice, featuredProducts]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ!`, {
      icon: '🛒',
      style: { borderRadius: '12px', background: '#1a1a1a', color: '#fff' }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const scrollToProducts = () => {
    productSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  const displayProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 10);

  const features = [
    { icon: HiOutlineSparkles, title: 'Hoa Tươi 100%', desc: 'Nhập mỗi ngày' },
    { icon: HiOutlineTruck, title: 'Giao Nhanh 2-4h', desc: 'Miễn phí nội thành' },
    { icon: HiOutlineGift, title: 'Gói Quà Miễn Phí', desc: 'Thiệp + Ruy băng' },
    { icon: HiOutlinePhone, title: 'Tư Vấn 24/7', desc: 'Hotline: 0839.477.199' },
  ];

  return (
    <>
      <SEO
        title="Trang Chủ"
        description="MINH ANH - Dịch vụ Mâm Quả, Hoa Cưới, Cổng Cưới hàng đầu An Giang. Chuyên cung cấp hoa tươi, mâm quả cưới hỏi, trang trí tiệc cưới đẹp, uy tín, giá tốt. Giao hàng tận nơi."
        keywords="mâm quả, hoa cưới, cổng cưới, hoa tươi, an giang, đám cưới, mâm quả cưới hỏi, trang trí tiệc cưới, hoa sinh nhật, hoa khai trương, minh anh"
        url="/"
      />
      <div className="min-h-screen bg-[#FEFDFB]">
        {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[55vh] lg:min-h-[65vh] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F5] via-[#FEF7F2] to-[#FCF5EE]" />
          
          {/* Hero Image with Animation */}
          <div className="absolute top-0 right-0 w-[55%] h-full opacity-0 lg:opacity-100 hero-image-animate">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105 slow-zoom-animate"
              style={{ backgroundImage: `url(${heroFlowers})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FEFDFB]/70 to-[#FEFDFB]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FEFDFB]/30 to-transparent" />
          </div>
          
          {/* Floating Decorations */}
          <div className="absolute top-20 left-[15%] w-3 h-3 bg-rose-300 rounded-full float-1 opacity-60" />
          <div className="absolute top-32 left-[25%] w-2 h-2 bg-pink-400 rounded-full float-2 opacity-50" />
          <div className="absolute top-48 left-[10%] w-4 h-4 bg-rose-200 rounded-full float-3 opacity-40" />
          <div className="absolute bottom-32 left-[20%] w-2 h-2 bg-amber-300 rounded-full float-1 opacity-50" />
          
          {/* Subtle Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 py-10 lg:py-14">
          <div className="max-w-2xl">
            {/* Badge với Animation */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 mb-5 slide-down-animate">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-xs font-medium text-rose-600 tracking-wide">GIAO HÀNG TẬN NƠI - AN GIANG</span>
            </div>

            {/* Heading - Fixed Layout với khoảng cách rõ ràng */}
            <div className="mb-6 space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif text-stone-800 leading-[1.2] tracking-tight slide-up-animate-1">
                Dịch Vụ Mâm Quả Cưới
              </h1>
              <div className="flex items-center gap-3 slide-up-animate-2">
                <span className="relative inline-block">
                  <span className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif font-semibold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent gradient-animate">
                    Minh Anh
                  </span>
                  {/* Underline decoration */}
                  <svg className="absolute -bottom-1 left-0 w-full h-3 text-rose-300" viewBox="0 0 120 12" preserveAspectRatio="none">
                    <path 
                      d="M2 8 Q 30 2, 60 8 T 118 8" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="none" 
                      strokeLinecap="round"
                      className="draw-line-animate"
                    />
                  </svg>
                </span>
                <span className="text-3xl md:text-4xl bounce-in-animate">🌸</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base lg:text-lg text-stone-500 mb-6 max-w-lg leading-relaxed slide-up-animate-3">
              Chuyên Cổng Cưới Hoa Tươi, Cổng Cưới Rồng Phụng, Mâm Quả Rồng Phụng, Mâm Quả Truyền Thống, Mâm Quả Hiện Đại.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative mb-6 slide-up-animate-4">
              <div className="flex items-center bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-rose-100/50 hover:border-rose-100 focus-within:shadow-xl focus-within:shadow-rose-100/50 focus-within:border-rose-200">
                <HiOutlineSearch className="w-5 h-5 text-stone-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm hoa, mâm quả, quà tặng..."
                  className="flex-1 px-4 py-3.5 lg:py-4 text-stone-700 placeholder:text-stone-400 focus:outline-none text-sm lg:text-base bg-transparent"
                />
                <button
                  type="submit"
                  className="px-5 lg:px-6 py-3.5 lg:py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium transition-all text-sm lg:text-base hover:from-rose-600 hover:to-pink-600 hover:shadow-lg active:scale-[0.98] flex-shrink-0"
                >
                  Tìm Kiếm
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-6 slide-up-animate-5">
              <button
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium transition-all hover:bg-stone-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 group"
              >
                Xem Sản Phẩm
                <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-stone-200 text-stone-700 rounded-xl text-sm font-medium transition-all hover:border-rose-300 hover:bg-rose-50 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 group"
              >
                <HiOutlinePhone className="w-4 h-4 transition-transform group-hover:rotate-12" />
                Đặt Hàng Riêng
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 fade-in-animate">
              <span className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-stone-100">
                <span className="text-amber-400 flex gap-0.5">
                  <span className="star-pop-1">★</span>
                  <span className="star-pop-2">★</span>
                  <span className="star-pop-3">★</span>
                  <span className="star-pop-4">★</span>
                  <span className="star-pop-5">★</span>
                </span>
                <span className="font-medium">4.9/5</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-stone-100">
                <span className="text-emerald-500">✓</span>
                <span>1000+ đơn thành công</span>
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-stone-300 flex justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-stone-400 scroll-down-animate" />
          </div>
        </div>
      </section>

      {/* ========== FEATURES BAR ========== */}
      <section className="border-y border-stone-100 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-stone-100">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 py-3 lg:py-4 px-2 lg:px-4 group cursor-default transition-colors hover:bg-rose-50/50"
              >
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="w-4 h-4 lg:w-5 lg:h-5 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm font-semibold text-stone-800 truncate">{f.title}</p>
                  <p className="text-[10px] lg:text-xs text-stone-500 truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FLASH SALE ========== */}
      <FlashSale />

      {/* ========== CATEGORIES ========== */}
      <section className="py-6 lg:py-8 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-serif text-stone-800">Danh Mục Sản Phẩm</h2>
            <Link to="/products" className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 group">
              Tất cả <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            <button
              onClick={() => { setSelectedCategory('all'); scrollToProducts(); }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-stone-800 text-white border-stone-800 shadow-lg'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:shadow'
              }`}
            >
              Tất cả
            </button>
            
            {displayCategories.map((cat, i) => {
              const hasImage = cat.image && cat.image !== '';
              const defaultCat = defaultCategories[i] || defaultCategories[0];
              
              return (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat.slug); scrollToProducts(); }}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                    selectedCategory === cat.slug
                      ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-rose-200 hover:bg-rose-50 hover:shadow'
                  }`}
                >
                  {hasImage ? (
                    <img src={getImageUrl(cat.image)} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="text-base">{defaultCat.icon}</span>
                  )}
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== PRODUCTS SECTION ========== */}
      <section ref={productSectionRef} className="py-6 lg:py-8 bg-[#FEFDFB]">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg lg:text-xl font-serif text-stone-800">Sản Phẩm</h2>
              <span className="text-sm text-stone-400">({filteredProducts.length} sản phẩm)</span>
            </div>
            
            {/* Price Filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {priceFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedPrice(filter.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedPrice === filter.value
                      ? 'bg-stone-800 text-white shadow'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-stone-200 rounded-xl mb-2" />
                  <div className="h-3 bg-stone-200 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
                {displayProducts.map((product, i) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={i}
                    getImageUrl={getImageUrl}
                    onQuickAdd={handleQuickAdd}
                    onQuickView={() => setQuickViewProduct(product)}
                    isFavorite={isFavorite(product._id)}
                    onToggleFavorite={() => handleToggleFavorite(product)}
                  />
                ))}
              </div>
              
              {/* Load More */}
              {filteredProducts.length > 12 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 hover:border-stone-300 transition-all hover:shadow"
                  >
                    {showAllProducts ? (
                      <>
                        Thu gọn
                        <HiOutlineChevronLeft className="w-4 h-4 rotate-90" />
                      </>
                    ) : (
                      <>
                        Xem thêm {filteredProducts.length - 12} sản phẩm
                        <HiOutlineChevronRight className="w-4 h-4 rotate-90" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-stone-500 mb-4">Không tìm thấy sản phẩm phù hợp</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedPrice('all'); }}
                className="text-rose-500 font-medium hover:text-rose-600"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========== WEDDING BANNER ========== */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-r from-rose-500 via-rose-400 to-pink-400 group">
            {/* Animated Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pattern-move"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
              }}
            />
            
            <div className="relative py-10 lg:py-16 px-6 lg:px-12 text-white">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-4">
                  💐 Dịch Vụ Trọn Gói
                </span>
                <h2 className="text-2xl lg:text-3xl font-serif mb-3 text-white">
                  Hoa Cưới & Mâm Quả Sang Trọng
                </h2>
                <p className="text-white/90 text-sm lg:text-base mb-6 leading-relaxed">
                  Tạo khoảnh khắc đáng nhớ cho ngày trọng đại. Từ bó hoa cô dâu đến mâm quả cưới trọn gói theo phong tục địa phương.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/hoa-cuoi"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-500 rounded-xl font-medium hover:bg-rose-50 transition-all hover:shadow-lg text-sm group"
                  >
                    Xem Hoa Cưới
                    <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/mam-qua-cuoi"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all text-sm"
                  >
                    Xem Mâm Quả
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-8 hidden lg:py-12 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-lg lg:text-xl font-serif text-stone-800 mb-2">Khách Hàng Nói Gì</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-amber-400 text-lg">★★★★★</span>
              <span className="text-stone-600 text-sm">4.9/5 từ 128 đánh giá</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Nguyễn Thị Mai', review: 'Hoa rất đẹp và tươi, giao hàng nhanh chóng. Đội ngũ tư vấn nhiệt tình!', rating: 5 },
              { name: 'Trần Văn An', review: 'Mâm quả cưới được trang trí rất đẹp, đúng theo yêu cầu. Rất hài lòng!', rating: 5 },
              { name: 'Lê Thị Hoa', review: 'Đặt giỏ quà tết gửi tặng đối tác, ai cũng khen đẹp và chất lượng.', rating: 5 },
            ].map((review, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-5 border border-stone-100 hover:shadow-lg hover:border-rose-100 transition-all">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-stone-600 text-sm mb-4 leading-relaxed">"{review.review}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                    {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-stone-700">{review.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEWSLETTER ========== */}
      <section className="py-10 hidden lg:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-gradient-to-r from-primary via-violet to-secondary rounded-3xl p-8 lg:p-10 shadow-xl shadow-primary/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl lg:text-3xl font-heading text-white mb-2">
                  Nhận Ưu Đãi Đặc Biệt
                </h3>
                <p className="text-white/80 text-sm lg:text-base">
                  Đăng ký để nhận thông tin về sản phẩm mới và khuyến mãi hấp dẫn
                </p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="px-5 py-3.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-72"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-6 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? 'Đang gửi...' : 'Đăng Ký'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ========== QUICK VIEW MODAL ========== */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          getImageUrl={getImageUrl}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleQuickAdd}
        />
      )}

      {/* ========== CUSTOM STYLES ========== */}
      <style>{`
        /* Scrollbar Hide */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Slide Down Animation */
        .slide-down-animate {
          animation: slideDown 0.6s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Slide Up Animations với delays */
        .slide-up-animate-1 {
          opacity: 0;
          animation: slideUp 0.6s ease-out 0.15s forwards;
        }
        .slide-up-animate-2 {
          opacity: 0;
          animation: slideUp 0.6s ease-out 0.3s forwards;
        }
        .slide-up-animate-3 {
          opacity: 0;
          animation: slideUp 0.6s ease-out 0.45s forwards;
        }
        .slide-up-animate-4 {
          opacity: 0;
          animation: slideUp 0.6s ease-out 0.55s forwards;
        }
        .slide-up-animate-5 {
          opacity: 0;
          animation: slideUp 0.6s ease-out 0.65s forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Fade In Animation */
        .fade-in-animate {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.8s forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Bounce In Animation */
        .bounce-in-animate {
          opacity: 0;
          animation: bounceIn 0.6s ease-out 0.5s forwards;
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Star Pop Animations */
        .star-pop-1 { opacity: 0; animation: starPop 0.4s ease-out 0.9s forwards; }
        .star-pop-2 { opacity: 0; animation: starPop 0.4s ease-out 1.0s forwards; }
        .star-pop-3 { opacity: 0; animation: starPop 0.4s ease-out 1.1s forwards; }
        .star-pop-4 { opacity: 0; animation: starPop 0.4s ease-out 1.2s forwards; }
        .star-pop-5 { opacity: 0; animation: starPop 0.4s ease-out 1.3s forwards; }
        @keyframes starPop {
          0% { opacity: 0; transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* Draw Line Animation */
        .draw-line-animate {
          stroke-dasharray: 150;
          stroke-dashoffset: 150;
          animation: drawLine 1s ease-out 0.6s forwards;
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }

        /* Gradient Animation */
        .gradient-animate {
          background-size: 200% auto;
          animation: gradientMove 3s ease infinite;
        }
        @keyframes gradientMove {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }

        /* Float Animations */
        .float-1 { animation: float1 4s ease-in-out infinite; }
        .float-2 { animation: float2 5s ease-in-out infinite; }
        .float-3 { animation: float3 3.5s ease-in-out infinite; }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        /* Hero Image Animation */
        .hero-image-animate {
          animation: heroImage 1s ease-out 0.2s forwards;
        }
        @keyframes heroImage {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Slow Zoom Animation */
        .slow-zoom-animate {
          animation: slowZoom 20s ease-in-out infinite;
        }
        @keyframes slowZoom {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.12); }
        }

        /* Scroll Down Animation */
        .scroll-down-animate {
          animation: scrollDown 1.5s ease-in-out infinite;
        }
        @keyframes scrollDown {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.5; }
        }

        /* Pattern Move Animation */
        .pattern-move {
          animation: patternMove 25s linear infinite;
        }
        @keyframes patternMove {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }

        /* Scale In Animation for Modal */
        .scale-in-animate {
          animation: scaleIn 0.3s ease-out forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* FadeIn for Products */
        .fadeIn-animate {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Line Clamp */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      </div>
    </>
  );
}

// ========== PRODUCT CARD COMPONENT ==========
interface ProductCardProps {
  product: Product;
  index: number;
  getImageUrl: (path: string) => string;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
  onQuickView: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function ProductCard({ product, index, getImageUrl, onQuickAdd, onQuickView, isFavorite, onToggleFavorite }: ProductCardProps) {
  return (
    <div
      className="group fadeIn-animate relative"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Favorite Button - Outside Link */}
      <button
        onClick={onToggleFavorite}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isFavorite
            ? 'bg-rose-500 text-white shadow-lg'
            : 'bg-white/90 backdrop-blur-sm text-stone-400 hover:bg-rose-500 hover:text-white shadow-md'
        }`}
      >
        {isFavorite ? (
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
                onClick={(e) => { e.preventDefault(); onQuickView(); }}
                className="w-9 h-9 rounded-lg bg-white shadow-lg flex items-center justify-center hover:bg-stone-50 transition-all hover:scale-110"
                title="Xem nhanh"
              >
                <HiOutlineEye className="w-4 h-4 text-stone-700" />
              </button>
              <button
                onClick={(e) => onQuickAdd(product, e)}
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
  );
}

// ========== QUICK VIEW MODAL ==========
interface QuickViewModalProps {
  product: Product;
  getImageUrl: (path: string) => string;
  onClose: () => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

function QuickViewModal({ product, getImageUrl, onClose, onAddToCart }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Close on ESC key
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-hidden shadow-2xl"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-stone-50 transition-all hover:rotate-90 duration-300"
        >
          <HiOutlineX className="w-5 h-5 text-stone-700" />
        </button>

        <div className="grid md:grid-cols-2 gap-0 max-h-[90vh] overflow-y-auto">
          {/* Images */}
          <div className="bg-stone-100 p-4 sticky top-0">
            <div className="aspect-square rounded-xl overflow-hidden mb-3 shadow-inner">
              <img
                src={getImageUrl(product.images?.[selectedImage] || '')}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-rose-500 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            <h2 className="text-xl font-serif text-stone-800 mb-2">{product.name}</h2>
            <p className="text-2xl font-bold text-rose-500 mb-4">
              {(product.price || 0).toLocaleString('vi-VN')}₫
            </p>
            
            {product.description && (
              <p className="text-sm text-stone-500 mb-4 line-clamp-3 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-stone-600">Số lượng:</span>
              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium border-x border-stone-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 transition-colors text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-400' : 'bg-stone-300'}`} />
              <span>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</span>
            </div>

            <div className="mt-auto flex gap-3">
              <button
                onClick={(e) => onAddToCart(product, e)}
                disabled={product.stock === 0}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all disabled:from-stone-300 disabled:to-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98]"
              >
                <HiOutlineShoppingBag className="w-5 h-5" />
                Thêm vào giỏ
              </button>
              <Link
                to={`/products/${product._id}`}
                className="px-5 py-3 border-2 border-stone-200 rounded-xl font-medium hover:bg-stone-50 hover:border-stone-300 transition-all text-stone-700"
              >
                Chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}