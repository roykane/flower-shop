import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineChat,
} from 'react-icons/hi';
import { useAuthStore } from '@/store/useStore';

const menuItems = [
  { path: '/admin', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { path: '/admin/products', icon: HiOutlineShoppingBag, label: 'Products' },
  { path: '/admin/categories', icon: HiOutlineCollection, label: 'Categories' },
  { path: '/admin/orders', icon: HiOutlineClipboardList, label: 'Orders' },
  { path: '/admin/chats', icon: HiOutlineChat, label: 'Live Chat' },
  { path: '/admin/blogs', icon: HiOutlineDocumentText, label: 'Blog' },
  { path: '/admin/users', icon: HiOutlineUsers, label: 'Users' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-neutral-900 text-white z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <span className="font-heading text-xl">Admin</span>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-800"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-neutral-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <HiOutlineLogout className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
              onClick={() => setSidebarOpen(true)}
            >
              <HiOutlineMenu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <NavLink
                to="/"
                className="text-neutral-600 hover:text-primary transition-colors"
              >
                View Store →
              </NavLink>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
