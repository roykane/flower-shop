import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineMenu,
  HiOutlineShoppingBag,
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiX
} from 'react-icons/hi';
import { useAuthStore, useCartStore, useFavoritesStore } from '@/store/useStore';
import logoMA from '@/assets/logo/logo-ma.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevTotalItems = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalItems } = useCartStore();
  const { items: favoriteItems } = useFavoritesStore();

  // Animate cart icon when items are added
  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/products', label: 'Sản Phẩm' },
    { href: '/hoa-cuoi', label: 'Hoa Cưới' },
    { href: '/blog', label: 'Blog' },
    { href: '/reviews', label: 'Đánh Giá' },
    { href: '/contact', label: 'Liên Hệ' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-primary via-violet to-secondary text-white text-center py-2.5 text-sm font-medium">
        <p className="container-custom flex items-center justify-center gap-2">
          <span>✨</span>
          <span>Hotline: 0839 477 199 | Zalo: 0944 600 344</span>
          <span>✨</span>
        </p>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass shadow-lg' : 'bg-white'
      }`}>
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-neutral-100 transition-all active:scale-95"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0">
              <img
                src={logoMA}
                alt="MINH ANH - Mâm Quả & Hoa Cưới"
                className="h-16 sm:h-[4.5rem] w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                      : 'text-neutral-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                className="p-2.5 rounded-xl hover:bg-neutral-100 transition-all active:scale-95"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <HiOutlineSearch className="w-5 h-5 text-neutral-600" />
              </button>

              <Link
                to="/favorites"
                className="hidden md:flex p-2.5 rounded-xl hover:bg-neutral-100 transition-all active:scale-95 relative group"
              >
                <HiOutlineHeart className="w-5 h-5 text-neutral-600 group-hover:text-primary transition-colors" />
                {favoriteItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-primary to-violet text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {favoriteItems.length > 9 ? '9+' : favoriteItems.length}
                  </span>
                )}
              </Link>

              <Link
                to={isAuthenticated ? '/orders' : '/track-order'}
                className="hidden md:flex p-2.5 rounded-xl hover:bg-neutral-100 transition-all active:scale-95 relative group"
                title={isAuthenticated ? 'Đơn hàng của tôi' : 'Tra cứu đơn hàng'}
              >
                <HiOutlineClipboardList className="w-5 h-5 text-neutral-600 group-hover:text-primary transition-colors" />
              </Link>

              <Link
                to="/cart"
                className={`p-2.5 rounded-xl hover:bg-neutral-100 transition-all active:scale-95 relative group ${
                  cartBounce ? 'animate-cart-bounce' : ''
                }`}
              >
                <HiOutlineShoppingBag className={`w-5 h-5 transition-colors ${
                  cartBounce ? 'text-primary' : 'text-neutral-600 group-hover:text-primary'
                }`} />
                {totalItems > 0 && (
                  <span className={`absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-primary to-violet text-white text-[10px] font-bold rounded-full flex items-center justify-center ${
                    cartBounce ? 'animate-ping-once' : 'animate-scale-in'
                  }`}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-1.5 rounded-xl hover:bg-neutral-100 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 animate-scale-in z-50">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="font-medium text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <HiOutlineUser className="w-4 h-4" />
                        Tài khoản
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <HiOutlineClipboardList className="w-4 h-4" />
                        Đơn hàng
                      </Link>
                      <div className="border-t border-neutral-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <HiOutlineLogout className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-2 ml-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <HiOutlineUser className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar - Expandable */}
          <div className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'max-h-16 pb-3' : 'max-h-0'}`}>
            <div className="relative animate-slide-down">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm yêu thích..."
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus={isSearchOpen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    navigate(`/products?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
                    setIsSearchOpen(false);
                  }
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <HiX className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-0 top-[120px] z-40 transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}>
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" />
          <nav className="container-custom py-6 relative">
            <div className="space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-4 py-3.5 rounded-xl text-base font-medium transition-all animate-slide-up ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-neutral-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link
                to="/favorites"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-neutral-700 hover:bg-neutral-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <HiOutlineHeart className="w-5 h-5" /> Yêu thích
                {favoriteItems.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-primary to-violet text-white text-xs font-bold rounded-full">
                    {favoriteItems.length}
                  </span>
                )}
              </Link>
              <Link
                to={isAuthenticated ? '/orders' : '/track-order'}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-neutral-700 hover:bg-neutral-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <HiOutlineClipboardList className="w-5 h-5" />
                {isAuthenticated ? 'Đơn hàng của tôi' : 'Tra cứu đơn hàng'}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-neutral-700 hover:bg-neutral-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <HiOutlineUser className="w-5 h-5" />
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base text-red-600 hover:bg-red-50 transition-colors w-full mt-2"
                  >
                    <HiOutlineLogout className="w-5 h-5" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block mt-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-violet text-white text-center font-semibold shadow-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng Nhập
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
