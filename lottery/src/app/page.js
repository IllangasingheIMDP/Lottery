'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/navbar';
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      color: 'bg-blue-50 hover:bg-blue-100'
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
      color: 'bg-emerald-50 hover:bg-emerald-100'
    },
    {
      title: 'Reports',
      description: 'Generate and view sales reports and analytics',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '#',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Settings',
      description: 'Configure system and user preferences',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '#',
      color: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header/>

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
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 md:py-10">
                <h2 className="text-2xl font-bold text-white">
                  {getGreeting()}, {user?.username || 'User'}!
                </h2>
                <p className="mt-2 text-blue-100">
                  Welcome to your lottery management dashboard. Here's an overview of your system.
                </p>
              </div>
              {/* <div className="px-6 py-5 bg-blue-50 border-t border-blue-100">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Last login: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                      View Activity
                    </button>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Quick access grid */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* System status */}
            <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">System Status</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-green-100 p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Database Status</h3>
                        <p className="text-sm text-green-600 mt-1">Running optimally</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-100 p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Updates</h3>
                        <p className="text-sm text-blue-600 mt-1">System up to date</p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-8">
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