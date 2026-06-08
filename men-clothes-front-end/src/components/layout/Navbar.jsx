import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  UserPlus,
  Package,
  Settings,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import api from '../../lib/api';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const items = useCartStore((state) => state.items) || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);

    try {
      await api.post('/api/auth/logout');
    } catch {
      // silent
    }

    clearUser();

    useCartStore.persist.setOptions({ name: 'cart-storage-guest' });
    await useCartStore.persist.rehydrate();

    navigate('/login');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '/home', onClick: handleHomeClick },
    { label: 'Products', href: '/home#featured-products' },
    { label: 'Shop', href: '/shop' },
    { label: 'About', href: '/home#about' },
    { label: 'Contact', href: '/home#contact' },
  ];

  const firstInitial =
    user?.firstName?.charAt(0) ||
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'U';

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-md shadow-premium'
        : 'bg-white shadow-sm'
        }`}
    >
      <div className="container-premium py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/home"
          onClick={handleHomeClick}
          className="text-2xl font-mono font-medium tracking-tight text-brand-900"
        >
          Men's Store
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={link.onClick}
              className="text-brand-600 hover:text-brand-900 text-sm font-medium transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2 text-brand-600 hover:text-red-500 transition"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative p-2 text-brand-600 hover:text-brand-900 transition"
          >
            <ShoppingCart className="w-5 h-5" />

            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {user ? (
                  <>
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 text-base text-gray-800 hover:bg-gray-50 transition"
                      >
                        <User className="w-5 h-5" />
                        My Profile
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 text-base text-gray-800 hover:bg-gray-50 transition"
                      >
                        <Package className="w-5 h-5" />
                        My Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-5 py-3 text-base text-red-500 hover:bg-red-50 transition border-t border-gray-100"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Welcome</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sign in for a better experience
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-800 hover:bg-gray-50 transition"
                      >
                        <User className="w-5 h-5" />
                        Sign in
                      </Link>

                      <Link
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-4 px-5 py-3 text-base text-gray-800 hover:bg-gray-50 transition"
                      >
                        <UserPlus className="w-5 h-5" />
                        Create account
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-brand-600 hover:text-brand-900 p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brand-100 py-4 px-4 shadow-lg">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => {
                  link.onClick?.();
                  setMobileMenuOpen(false);
                }}
                className="text-brand-700 hover:text-brand-900 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-brand-700 hover:text-brand-900 py-2 text-sm"
              >
                Admin Panel
              </Link>
            )}

            <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-1">
              {user ? (
                <>
                  <div className="py-2">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-brand-900">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-brand-700 hover:text-brand-900 py-2 text-sm"
                  >
                    My Profile
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-brand-700 hover:text-brand-900 py-2 text-sm"
                  >
                    My Orders
                  </Link>

                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-brand-700 hover:text-brand-900 py-2 text-sm"
                  >
                    Wishlist ❤️
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-red-500 hover:text-red-600 py-2 text-sm"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-brand-700 hover:text-brand-900 py-2 text-sm"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-brand-700 hover:text-brand-900 py-2 text-sm"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}