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
  
  // Applied filters (actual filters used for fetching)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFilter: {
      type: 'today',
      from: '',
      to: ''
    },
    sortBy: 'date',
    sortOrder: 'desc'
  });

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
  
  // Collapse state for profit records table
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Fetch profit data based on applied filters
  const fetchProfits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/daily_profit`;
      const params = [];
      
      // Add date filters from applied filters
      if (appliedFilters.dateFilter.type === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.push(`date=${today}`);
      } else if (appliedFilters.dateFilter.type === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.push(`from=${weekAgo.toISOString().split('T')[0]}`);
        params.push(`to=${today.toISOString().split('T')[0]}`);
      } else if (appliedFilters.dateFilter.type === 'month') {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        params.push(`from=${monthAgo.toISOString().split('T')[0]}`);
        params.push(`to=${today.toISOString().split('T')[0]}`);
      } else if (appliedFilters.dateFilter.type === 'year') {
        const today = new Date();
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        params.push(`from=${yearAgo.toISOString().split('T')[0]}`);
        params.push(`to=${today.toISOString().split('T')[0]}`);
      } else if (appliedFilters.dateFilter.type === 'custom' && appliedFilters.dateFilter.from && appliedFilters.dateFilter.to) {
        params.push(`from=${appliedFilters.dateFilter.from}`);
        params.push(`to=${appliedFilters.dateFilter.to}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch profit data');
      }

      let data = await response.json();
      console.log(data);
      // Sort data
      data.sort((a, b) => {
        if (appliedFilters.sortBy === 'date') {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return appliedFilters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          return appliedFilters.sortOrder === 'asc' ? a.total_profit - b.total_profit : b.total_profit - a.total_profit;
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
  }, [appliedFilters]);

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
    const newFilter = { ...dateFilter, type };
    setDateFilter(newFilter);
    
    // Auto-apply for non-custom filters
    if (type !== 'custom') {
      setAppliedFilters({
        dateFilter: newFilter,
        sortBy,
        sortOrder
      });
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDateFilter({ ...dateFilter, [field]: value });
  };

  // Apply filters manually (for custom range)
  const applyFilters = () => {
    setAppliedFilters({
      dateFilter: { ...dateFilter },
      sortBy,
      sortOrder
    });
  };

  // Reset filters
  const resetFilters = () => {
    const resetFilter = { type: 'all', from: '', to: '' };
    setDateFilter(resetFilter);
    setSortBy('date');
    setSortOrder('desc');
    setAppliedFilters({
      dateFilter: resetFilter,
      sortBy: 'date',
      sortOrder: 'desc'
    });
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (dateFilter.type !== 'custom') {
                    setAppliedFilters({
                      dateFilter,
                      sortBy: e.target.value,
                      sortOrder
                    });
                  }
                }}
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
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  if (dateFilter.type !== 'custom') {
                    setAppliedFilters({
                      dateFilter,
                      sortBy,
                      sortOrder: e.target.value
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
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
                  min="2025-09-21"
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateFilter.to}
                  min="2025-09-21"
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {dateFilter.type === 'custom' && (
              <button
                onClick={applyFilters}
                disabled={!dateFilter.from || !dateFilter.to}
                className={`${
                  dateFilter.from && dateFilter.to
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                } text-white font-medium py-2 px-6 rounded-lg transition-colors`}
              >
                Apply Filters
              </button>
            )}
            <button
              onClick={resetFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
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
                  <div className="relative min-w-full" style={{ height: '300px' }}>
                    <svg width="100%" height="100%" className="overflow-visible">
                      {(() => {
                        // Determine which data to show
                        let displayData = chartData;
                        let showingRange = false;
                        
                        // If custom range, week, month, or year is selected, show all data in that range
                        if (appliedFilters.dateFilter.type === 'custom' || appliedFilters.dateFilter.type === 'week' || 
                            appliedFilters.dateFilter.type === 'month' || appliedFilters.dateFilter.type === 'year') {
                          displayData = chartData;
                          showingRange = true;
                        } else {
                          // Otherwise show last 30 days
                          displayData = chartData.slice(-30);
                        }
                        
                        if (displayData.length === 0) return null;
                        
                        const maxProfit = Math.max(...displayData.map(d => d.profit));
                        const minProfit = Math.min(...displayData.map(d => d.profit));
                        const range = maxProfit - minProfit || 1;
                        const padding = { top: 40, right: 20, bottom: 60, left: 60 };
                        const chartHeight = 300 - padding.top - padding.bottom;
                        const chartWidth = displayData.length * (showingRange ? Math.max(40, 800 / displayData.length) : 25);
                        
                        // Calculate points for the line
                        const points = displayData.map((item, index) => {
                          const x = padding.left + (index / (displayData.length - 1 || 1)) * chartWidth;
                          const y = padding.top + chartHeight - ((item.profit - minProfit) / range) * chartHeight;
                          return { x, y, ...item };
                        });
                        
                        // Create smooth curve path using quadratic bezier curves
                        let pathD = `M ${points[0].x} ${points[0].y}`;
                        for (let i = 0; i < points.length - 1; i++) {
                          const current = points[i];
                          const next = points[i + 1];
                          const controlX = (current.x + next.x) / 2;
                          pathD += ` Q ${controlX} ${current.y}, ${controlX} ${current.y}`;
                          pathD += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
                        }
                        
                        // Create area fill path
                        const zeroY = padding.top + chartHeight - ((0 - minProfit) / range) * chartHeight;
                        let areaPath = pathD + ` L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;
                        
                        return (
                          <g>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((factor, i) => {
                              const y = padding.top + chartHeight * (1 - factor);
                              const value = minProfit + range * factor;
                              return (
                                <g key={i}>
                                  <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={padding.left + chartWidth}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="text-xs fill-gray-500"
                                  >
                                    {formatCurrency(value)}
                                  </text>
                                </g>
                              );
                            })}
                            
                            {/* Zero line */}
                            {minProfit < 0 && maxProfit > 0 && (
                              <line
                                x1={padding.left}
                                y1={zeroY}
                                x2={padding.left + chartWidth}
                                y2={zeroY}
                                stroke="#6b7280"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                              />
                            )}
                            
                            {/* Area fill */}
                            <path
                              d={areaPath}
                              fill="url(#gradient)"
                              opacity="0.3"
                            />
                            
                            {/* Gradient definition */}
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                              </linearGradient>
                            </defs>
                            
                            {/* Line path */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            
                            {/* Data points */}
                            {points.map((point, index) => (
                              <g key={index}>
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill={point.profit >= 0 ? '#10b981' : '#ef4444'}
                                  stroke="white"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:r-6 transition-all"
                                />
                                {/* Tooltip on hover */}
                                <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                  <rect
                                    x={point.x - 60}
                                    y={point.y - 50}
                                    width="120"
                                    height="40"
                                    fill="#1f2937"
                                    rx="4"
                                  />
                                  <text
                                    x={point.x}
                                    y={point.y - 32}
                                    textAnchor="middle"
                                    className="text-xs fill-white font-medium"
                                  >
                                    {formatDate(point.date)}
                                  </text>
                                  <text
                                    x={point.x}
                                    y={point.y - 18}
                                    textAnchor="middle"
                                    className="text-xs fill-white"
                                  >
                                    Rs. {formatCurrency(point.profit)}
                                  </text>
                                </g>
                              </g>
                            ))}
                            
                            {/* X-axis labels */}
                            {points.map((point, index) => {
                              // Show fewer labels if too many points
                              const showLabel = displayData.length <= 30 || index % Math.ceil(displayData.length / 20) === 0;
                              if (!showLabel) return null;
                              
                              return (
                                <text
                                  key={`label-${index}`}
                                  x={point.x}
                                  y={padding.top + chartHeight + 20}
                                  textAnchor="middle"
                                  className="text-xs fill-gray-500"
                                  transform={`rotate(-45, ${point.x}, ${padding.top + chartHeight + 20})`}
                                >
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>
                              );
                            })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {appliedFilters.dateFilter.type === 'custom' || appliedFilters.dateFilter.type === 'week' || 
                   appliedFilters.dateFilter.type === 'month' || appliedFilters.dateFilter.type === 'year'
                    ? `Showing ${chartData.length} records in selected range`
                    : `Showing last ${Math.min(chartData.length, 30)} days`}
                </p>
              </div>
            )}

            {/* Profit Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Profit Records</h3>
                  <p className="text-sm text-gray-600">Showing {profits.length} records</p>
                </div>
                <button
                  onClick={() => setIsTableExpanded(!isTableExpanded)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isTableExpanded ? (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Collapse
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Expand
                    </>
                  )}
                </button>
              </div>
              
              {isTableExpanded && (
                <>
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
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}