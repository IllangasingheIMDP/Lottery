'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user');
        if (!res.ok){ 
            router.push('/login');
            throw new Error('Failed to fetch user data');
            
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        // If user data can't be fetched, they might not be logged in
        // You could redirect to login page here if appropriate
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        // Redirect to login page after successful logout
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Skip rendering the header on login page
  if (pathname === '/login') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Manage Shops', href: '/manage-shops' },
    { name: 'Daily Distributions', href: '/daily_distributions' },
    { name: 'Lottery Records', href: '/lottery-records' },
    
    { name: 'Ordering Notes', href: '/ordering_notes' },
    { name: 'Orders', href: '/orders' },
    { name: 'Profit Statistics', href: '/profit-statistics' },
  ];

  return (
    <header className="rounded-b-3xl bg-gradient-to-r from-[#181c2b] via-[#23263a] to-[#181c2b] shadow-lg shadow-blue-900/40 border-b border-blue-900/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent tracking-tight drop-shadow-lg">
              Lottery Management
            </Link>
            {/* Desktop navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-2 items-center">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold
                  ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-900/30'
                      : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                  }`}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* User info and logout button */}
          <div className="flex items-center">
            {!loading && user && (
              <>
                <div className="hidden md:flex md:items-center">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 via-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/30 border-2 border-blue-400">
                    {user.username ? user.username[0].toUpperCase() : '?'}
                  </div>
                  <span className="ml-3 text-base font-semibold text-blue-100">{user.username}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-4 px-2 py-1 rounded-xl bg-gradient-to-r from-blue-700/50 via-blue-500/50 to-cyan-500/50 text-white font-light shadow-lg shadow-blue-900/30 hover:from-cyan-500 hover:via-blue-500 hover:to-teal-500 transition-all "
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <div className="flex md:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed */}
                <svg
                  className={`${mobileMenuOpen ? 'hidden' : 'block'} h-7 w-7`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon when menu is open */}
                <svg
                  className={`${mobileMenuOpen ? 'block' : 'hidden'} h-7 w-7`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-[#23263a] border-t border-blue-900/30 shadow-lg shadow-blue-900/20`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-5 py-3 rounded-xl text-base font-semibold transition-all duration-200
              ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 text-white shadow'
                  : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
              }`}
            aria-current={pathname === item.href ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </div>
      {/* User info in mobile menu */}
      {!loading && user && (
        <div className="pt-4 pb-3 border-t border-blue-900/30">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 via-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/30 border-2 border-blue-400">
                {user.username ? user.username[0].toUpperCase() : '?'}
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-semibold text-blue-100">{user.username}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 rounded-xl text-base font-semibold text-blue-200 hover:text-white hover:bg-blue-900/40 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  </header>
  );
}
