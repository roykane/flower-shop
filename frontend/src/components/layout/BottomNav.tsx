import { NavLink } from 'react-router-dom';
import { HiOutlineHome, HiOutlineSearch, HiOutlineShoppingBag, HiOutlineUser } from 'react-icons/hi';
import { useCartStore } from '@/store/useStore';

export default function BottomNav() {
  const { totalItems } = useCartStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
      <div className="flex items-center justify-around h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 ${isActive ? 'text-primary' : 'text-neutral-500'}`
          }
        >
          <HiOutlineHome className="w-6 h-6" />
          <span className="text-xs">Trang Chủ</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 ${isActive ? 'text-primary' : 'text-neutral-500'}`
          }
        >
          <HiOutlineSearch className="w-6 h-6" />
          <span className="text-xs">Khám Phá</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 relative ${isActive ? 'text-primary' : 'text-neutral-500'}`
          }
        >
          <HiOutlineShoppingBag className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute top-0 right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <span className="text-xs">Giỏ Hàng</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 ${isActive ? 'text-primary' : 'text-neutral-500'}`
          }
        >
          <HiOutlineUser className="w-6 h-6" />
          <span className="text-xs">Tài Khoản</span>
        </NavLink>
      </div>
    </nav>
  );
}
