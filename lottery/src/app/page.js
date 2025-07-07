'use client';
import Head from 'next/head';
<Head>
  <link rel="preload" href="/dashboard_bg.webp" as="image" />
</Head>

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/navbar';
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unbalancedRecords, setUnbalancedRecords] = useState([]);
  const [showAllUnbalanced, setShowAllUnbalanced] = useState(false);
  const [unbalancedLoading, setUnbalancedLoading] = useState(false);
  const [unbalancedLoaded, setUnbalancedLoaded] = useState(false);
  const [unbalancedError, setUnbalancedError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Get time of day for personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = [
    {
      title: 'Manage Shops',
      description: 'Add, edit and manage shop information',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/manage-shops',
      text_color: 'bg-gradient-to-r from-white/100 via-blue-200',
      color: 'bg-blue-200/5  rounded-xl shadow-lg shadow-blue-200 border border-white/20 backdrop-blur-xl hover:bg-blue-200/50'
    },
    {
      title: 'Lottery Records',
      description: 'View and manage lottery record entries',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      link: '/lottery-records',
      text_color: 'bg-gradient-to-r from-white/100 via-emerald-200',
      color: 'bg-emerald-50/5 backdrop-blur-xl rounded-xl shadow-lg shadow-emerald-200 border border-white/20 hover:bg-emerald-100/50'
    },
    {
      title: 'Ordering Details',
      description: 'Edit and manage ordering details',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      link: '/ordering-details',
      text_color: 'bg-gradient-to-r from-white via-purple-200',
      color: 'bg-purple-50/10 backdrop-blur-2xl rounded-xl shadow-purple-200 shadow-lg border border-white/20 hover:bg-purple-100/50'
    },
    {
      title: 'Orders Management',
      description: 'Order for three days',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      link: '/orders',
      text_color: 'bg-gradient-to-r from-white/100 via-red-200',
      color: 'bg-red-50/10 backdrop-blur-xl rounded-xl shadow-red-200 shadow-lg border border-white/20 hover:bg-red-100/50'
    }
  ];

  const handleLoadUnbalanced = async () => {
    setUnbalancedLoading(true);
    setUnbalancedError(null);
    try {
      const res = await fetch('/api/daily_records/unbalanced');
      if (!res.ok) throw new Error('Failed to fetch unbalanced records');
      const data = await res.json();
      setUnbalancedRecords(data);
      setUnbalancedLoaded(true);
    } catch (err) {
      setUnbalancedError(err.message);
    } finally {
      setUnbalancedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/dashboard_bg.webp')] bg-cover bg-top bg-no-repeat">

      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-800">
            <p>Error loading dashboard: {error}</p>
          </div>
        ) : (
          <>
            {/* Welcome message */}
            <div className="bg-transparent rounded-lg shadow border-white/20 border overflow-hidden mb-8">
              <div className="bg-white/10 backdrop-blur-xl px-6 py-8 md:py-10">
                <h2 className="text-2xl font-bold text-blue-300">
                  {getGreeting()}, {user?.username || 'User'}!
                </h2>
                <p className="mt-2 text-blue-100">
                  Welcome to your lottery management dashboard. Here&apos;s an overview of your system.
                </p>
              </div>
              
            </div>

            {/* Quick access grid */}
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Quick Access</h2>
            <div className="grid bg-transparent grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {cards.map((card, index) => (
                <Link
                  href={card.link}
                  key={index}
                  className={`block rounded-lg shadow overflow-hidden transition-transform duration-300 hover:scale-105 ${card.color}`}
                >
                  <div className="p-6">
                    <div className="mb-4">
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-1 bg-gray-200 bg-clip-text text-transparent">
                      {card.title}
                    </h3>

                    <p className={`text-sm font-sans ${card.text_color} bg-clip-text text-transparent`} >{card.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* System status */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-md shadow-white overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-200">System Status</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-between sm:">
                  <div className="bg-green-400/30  rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-green-100 p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-300">Database Status</h3>
                        <p className="text-sm text-green-300 mt-1">Running optimally</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-400/50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-100 p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-300">Updates</h3>
                        <p className="text-sm text-blue-300 mt-1">System up to date</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            {/* Unbalanced or Faulty Records */}
            <div className="bg-white/60 backdrop-blur-3xl rounded-xl shadow-md shadow-blue-600/50 overflow-hidden mt-8">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Unbalanced or Faulty Records</h2>
                {unbalancedLoaded && unbalancedRecords.length > 2 && (
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setShowAllUnbalanced((prev) => !prev)}
                  >
                    {showAllUnbalanced ? 'Show less' : 'See more'}
                  </button>
                )}
              </div>
              <div className="p-3 sm:p-6">
                {!unbalancedLoaded ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadUnbalanced}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
                      disabled={unbalancedLoading}
                    >
                      {unbalancedLoading ? 'Loading...' : 'Load Data'}
                    </button>
                    {unbalancedError && (
                      <div className="text-red-600 mt-2">{unbalancedError}</div>
                    )}
                  </div>
                ) : unbalancedLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : unbalancedError ? (
                  <div className="bg-red-50 p-4 rounded-lg text-red-800">
                    <p>Error loading records: {unbalancedError}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:-mx-6">
                    {unbalancedRecords?.length > 0 ? (
                      (showAllUnbalanced ? unbalancedRecords : unbalancedRecords.slice(0, 2)).map((record, index) => (
                        <div key={index} className="mb-6">
                          <h3 className="text-md font-medium text-gray-900 mb-2 px-3 sm:px-6">{record.date}</h3>
                          <div className="min-w-full overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200/60">
                              <thead className="bg-gray-50/60">
                                <tr>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unbalanced</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faulty</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white/60 divide-y divide-gray-200">
                                {record.shops.map((shop, shopIndex) => (
                                  <tr key={shopIndex} className="hover:bg-gray-50">
                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{shop.shop_name}</td>
                                    <td className={`px-3 sm:px-6 py-3 whitespace-nowrap text-sm ${shop.balanced === 0 ? 'text-red-600 font-medium' : 'text-green-500'}`}>
                                      {shop.remaining_balance}
                                    </td>
                                    <td className={`px-3 sm:px-6 py-3 whitespace-nowrap text-sm ${shop.has_faulty ? 'text-red-500 font-medium' : 'text-green-500'}`}>
                                      {shop.faulty_total_price}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">
                                      <Link
                                        href={`/add-edit-record?shopId=${shop.shop_id}&date=${record.date}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        Edit
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-8">
                        No unbalanced or faulty records found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-8 bottom-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lottery Management System. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Help</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}