'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/navbar';

export default function ProfitStatistics() {
  const router = useRouter();
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState({
    type: 'today', // 'all', 'today', 'week', 'month', 'year', 'custom'
    from: '',
    to: ''
  });
  const [sortBy, setSortBy] = useState('date'); // 'date', 'profit'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [limit, setLimit] = useState(50);

  // Statistics states
  const [statistics, setStatistics] = useState({
    totalProfit: 0,
    totalKumaraProfit: 0,
    totalManagerProfit: 0,
    averageProfit: 0,
    averageKumaraProfit: 0,
    averageManagerProfit: 0,
    highestProfit: 0,
    lowestProfit: 0,
    totalDays: 0,
    profitableDays: 0,
    lossdays: 0
  });

  // Chart data state
  const [chartData, setChartData] = useState([]);

  // Fetch profit data based on filters
  const fetchProfits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/daily_profit?limit=${limit}`;
      
      // Add date filters
      if (dateFilter.type === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `&date=${today}`;
      } else if (dateFilter.type === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        url += `&from=${weekAgo.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter.type === 'month') {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        url += `&from=${monthAgo.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter.type === 'year') {
        const today = new Date();
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        url += `&from=${yearAgo.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter.type === 'custom' && dateFilter.from && dateFilter.to) {
        url += `&from=${dateFilter.from}&to=${dateFilter.to}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch profit data');
      }

      let data = await response.json();
      console.log(data);
      // Sort data
      data.sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          return sortOrder === 'asc' ? a.total_profit - b.total_profit : b.total_profit - a.total_profit;
        }
      });

      setProfits(data);
      calculateStatistics(data);
      prepareChartData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching profits:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, sortBy, sortOrder, limit]);

  // Calculate statistics
  const calculateStatistics = (data) => {
    if (data.length === 0) {
      setStatistics({
        totalProfit: 0,
        averageProfit: 0,
        highestProfit: 0,
        lowestProfit: 0,
        totalDays: 0,
        profitableDays: 0,
        lossdays: 0
      });
      return;
    }

    const totalKumaraProfit = data.reduce((sum, item) => sum + item.kumara_profit, 0);
    const totalManagerProfit = data.reduce((sum, item) => sum + item.manager_profit, 0);
    const totalProfit = data.reduce((sum, item) => sum + item.total_profit, 0);
    const averageKumaraProfit = totalKumaraProfit / data.length;
    const averageManagerProfit = totalManagerProfit / data.length;
    const averageProfit = totalProfit / data.length;
    const profits = data.map(item => item.total_profit);
    const highestProfit = Math.max(...profits);
    const lowestProfit = Math.min(...profits);
    const profitableDays = data.filter(item => item.total_profit > 0).length;
    const lossdays = data.filter(item => item.total_profit < 0).length;

    setStatistics({
      totalKumaraProfit,
      totalManagerProfit,
      totalProfit,
      averageKumaraProfit,
      averageManagerProfit,
      averageProfit,
      highestProfit,
      lowestProfit,
      totalDays: data.length,
      profitableDays,
      lossdays
    });
  };

  // Prepare data for charts
  const prepareChartData = (data) => {
    // Sort by date for chart
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    // Make sure each item has the correct field name for charts
    const chartReadyData = sortedData.map(item => ({
      ...item,
      profit: item.total_profit // Map total_profit to profit for chart compatibility
    }));
    setChartData(chartReadyData);
  };

  // Format currency
  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle filter changes
  const handleDateFilterChange = (type) => {
    setDateFilter({ ...dateFilter, type });
  };

  const handleCustomDateChange = (field, value) => {
    setDateFilter({ ...dateFilter, [field]: value });
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter({ type: 'all', from: '', to: '' });
    setSortBy('date');
    setSortOrder('desc');
    setLimit(50);
  };

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchProfits();
  }, [fetchProfits]);

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profit Statistics</h1>
          <button
            onClick={() => router.push('/lottery-records')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back to Records
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter.type}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="profit">Profit Amount</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="25">25 Records</option>
                <option value="50">50 Records</option>
                <option value="100">100 Records</option>
                <option value="200">200 Records</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter.type === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={resetFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profit data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Total Profit</h3>
                    <p className={`text-2xl font-bold ${statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs. {formatCurrency(statistics.totalProfit)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Kumara&apos;s Total</h3>
                    <p className={`text-2xl font-bold ${statistics.totalKumaraProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Rs. {formatCurrency(statistics.totalKumaraProfit)}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Manager&apos;s Total</h3>
                    <p className={`text-2xl font-bold ${statistics.totalManagerProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      Rs. {formatCurrency(statistics.totalManagerProfit)}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Average Daily</h3>
                    <p className={`text-2xl font-bold ${statistics.averageProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      Rs. {formatCurrency(statistics.averageProfit)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Days: {statistics.totalDays}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Highest Daily Profit</h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      Rs. {formatCurrency(statistics.highestProfit)}
                    </p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Lowest Daily Profit</h3>
                    <p className="text-2xl font-bold text-red-600">
                      Rs. {formatCurrency(statistics.lowestProfit)}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Performance</h3>
                    <p className="text-sm text-gray-600">Profitable Days: <span className="font-bold text-green-600">{statistics.profitableDays}</span></p>
                    <p className="text-sm text-gray-600">Loss Days: <span className="font-bold text-red-600">{statistics.lossdays}</span></p>
                  </div>
                  <div className="bg-teal-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Profit Trend</h3>
                <div className="overflow-x-auto">
                  <div className="flex items-end space-x-1 min-w-full" style={{ height: '200px' }}>
                    {chartData.slice(-30).map((item, index) => {
                      const maxProfit = Math.max(...chartData.map(d => Math.abs(d.profit)));
                      const height = Math.abs(item.profit) / maxProfit * 150;
                      const isPositive = item.profit >= 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center group relative">
                          <div
                            className={`w-6 ${isPositive ? 'bg-green-500' : 'bg-red-500'} rounded-t transition-all duration-300 group-hover:opacity-80`}
                            style={{ height: `${Math.max(height, 2)}px` }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatDate(item.date)}<br />
                            Rs. {formatCurrency(item.profit)}
                          </div>
                          <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                            {new Date(item.date).getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Showing last 30 records. Green bars represent profit, red bars represent loss.
                </p>
              </div>
            )}

            {/* Profit Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Profit Records</h3>
                <p className="text-sm text-gray-600">Showing {profits.length} records</p>
              </div>
              
              {profits.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No profit records found</h3>
                  <p className="mt-1 text-gray-500">Try adjusting your filters or add some profit records.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kumara&apos;s Profit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manager&apos;s Profit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Profit
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profits.map((profit, index) => (
                        <tr key={profit.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(profit.date)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            profit.kumara_profit >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            Rs. {formatCurrency(profit.kumara_profit)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            profit.manager_profit >= 0 ? 'text-purple-600' : 'text-red-600'
                          }`}>
                            Rs. {formatCurrency(profit.manager_profit)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            profit.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Rs. {formatCurrency(profit.total_profit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profit.total_profit >= 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {profit.total_profit >= 0 ? 'Profit' : 'Loss'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}