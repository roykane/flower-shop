import { Link } from 'react-router-dom';
import { HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import { FaFacebookF } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';
import logoMA from '@/assets/logo/logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { to: '/products', label: 'Sản Phẩm' },
    { to: '/hoa-cuoi', label: 'Hoa Cưới' },
    { to: '/mam-qua-cuoi', label: 'Mâm Quả' },
    { to: '/reviews', label: 'Đánh Giá' },
    { to: '/contact', label: 'Liên Hệ' },
  ];

  return (
    <footer className="bg-gradient-to-r from-rose-50 via-pink-50 to-violet-50 border-t border-rose-100">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

          {/* Brand + Social */}
          <div className="flex items-center gap-6">
            <Link to="/">
              <img
                src={logoMA}
                alt="MINH ANH"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <div className="hidden sm:block h-10 w-px bg-rose-200" />
            <div className="hidden sm:flex gap-2">
              <a
                href="https://www.facebook.com/tu.le.733057"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              >
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a
                href="https://zalo.me/0944600344"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-blue-400 flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
              >
                <SiZalo className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-neutral-600 hover:text-primary text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <a
              href="tel:0839477199"
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center text-white flex-shrink-0">
                <HiOutlinePhone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold block">0839 477 199</span>
                <span className="text-xs text-neutral-500">Zalo: 0944 600 344</span>
              </div>
            </a>
            <a
              href="https://maps.google.com/?q=A0.34+Co+Bac+Vinh+Bao+Rach+Gia+Kien+Giang"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-purple-400 flex items-center justify-center text-white flex-shrink-0">
                <HiOutlineLocationMarker className="w-4 h-4" />
              </div>
              <div>
                <span className="block">A0.34 Cô Bắc, P.Vĩnh Bảo</span>
                <span className="text-xs text-neutral-500">Tp.Rạch Giá, Kiên Giang</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-rose-100 bg-white/60">
        <div className="container mx-auto px-4 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-neutral-500">
              © {currentYear} <span className="font-medium text-neutral-700">MINH ANH Flowers</span> · Kiên Giang
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Thanh toán:</span>
              <div className="flex gap-1.5">
                <span className="px-2 py-1 bg-blue-600 rounded text-[10px] font-bold text-white">VISA</span>
                <span className="px-2 py-1 bg-orange-500 rounded text-[10px] font-bold text-white">MC</span>
                <span className="px-2 py-1 bg-pink-500 rounded text-[10px] font-bold text-white">MoMo</span>
                <span className="px-2 py-1 bg-emerald-500 rounded text-[10px] font-bold text-white">COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
