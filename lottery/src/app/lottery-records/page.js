'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/navbar';
export default function LotteryRecords() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shops, setShops] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState({
    totalWorth: 0,
    totalCashGiven: 0,
    nlbTicketsCount: 0,
    nlbTotalPrice: 0,
    dlbTicketsCount: 0,
    dlbTotalPrice: 0,
    totalTicketsPrice: 0,
    totalMoney: 0,
    faultyTotalPrice: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch('/api/shops');
        if (res.ok) {
          setShops(await res.json());
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };
    fetchShops();
  }, [router]);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/daily_records/all?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
          calculateSummaries(data);
        }
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (date) {
      fetchRecords();
    }
  }, [date]);

  const calculateSummaries = (records) => {
    const calculatedSummaries = {
      totalWorth: 0,
      totalCashGiven: 0,
      nlbTicketsCount: 0,
      nlbTotalPrice: 0,
      dlbTicketsCount: 0,
      dlbTotalPrice: 0,
      totalTicketsPrice: 0,
      totalMoney: 0,
      faultyTotalPrice: 0
    };
    
    records.forEach(record => {
      // Parse numeric values to ensure proper calculations
      calculatedSummaries.totalWorth += parseFloat(record.total_worth || 0);
      calculatedSummaries.totalCashGiven += parseFloat(record.cash_given || 0);
      calculatedSummaries.nlbTotalPrice += parseFloat(record.nlb_total_price || 0);
      calculatedSummaries.dlbTotalPrice += parseFloat(record.dlb_total_price || 0);
      calculatedSummaries.faultyTotalPrice += parseFloat(record.faulty_total_price || 0);
      calculatedSummaries.totalTicketsPrice += parseFloat(record.got_tickets_total_price || 0);
      
      // Count NLB tickets
      if (record.nlb) {
        Object.entries(record.nlb).forEach(([denomination, count]) => {
          if (denomination !== '0') { // Skip if denomination is 0
            calculatedSummaries.nlbTicketsCount += parseInt(count || 0);
          }
        });
      }
      
      // Count DLB tickets
      if (record.dlb) {
        Object.entries(record.dlb).forEach(([denomination, count]) => {
          if (denomination !== '0') { // Skip if denomination is 0
            calculatedSummaries.dlbTicketsCount += parseInt(count || 0);
          }
        });
      }
    });
    
    // Calculate total money (cash given + tickets total price)
    calculatedSummaries.totalMoney = calculatedSummaries.totalCashGiven + calculatedSummaries.totalTicketsPrice;
    
    setSummaries(calculatedSummaries);
  };

  const handleAddEdit = (shopId) => router.push(`/add-edit-record?shopId=${shopId}&date=${date}`);
  const handleView = (shopId) => router.push(`/view-record?shopId=${shopId}&date=${date}`);

  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2);
  };

  return (
    <div>
      <Header/>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Lottery Records</h1>
      
      {/* Date Selector */}
      <div className="mb-8">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Date:
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="shadow appearance-none border rounded ml-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </label>
      </div>
      
      {/* Analytics Dashboard */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Financial Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">Financial Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Worth:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.totalWorth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cash Given:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.totalCashGiven)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Money:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.totalMoney)}</span>
                </div>
              </div>
            </div>
            
            {/* NLB Tickets Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-semibold mb-4 text-green-800">NLB Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">NLB Tickets Count:</span>
                  <span className="font-medium">{summaries.nlbTicketsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NLB Total Value:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.nlbTotalPrice)}</span>
                </div>
              </div>
            </div>
            
            {/* DLB Tickets Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <h3 className="text-xl font-semibold mb-4 text-purple-800">DLB Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">DLB Tickets Count:</span>
                  <span className="font-medium">{summaries.dlbTicketsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DLB Total Value:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.dlbTotalPrice)}</span>
                </div>
              </div>
            </div>
            
            {/* Tickets Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-semibold mb-4 text-yellow-800">Tickets Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tickets Value:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.totalTicketsPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Faulty Tickets Value:</span>
                  <span className="font-medium">Rs. {formatCurrency(summaries.faultyTotalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Shops Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Shops</h2>
          <button 
            onClick={() => router.push('/manage-shops')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Manage Shops
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shops.map((shop) => (
            <div 
              key={shop.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-semibold truncate">{shop.name}</h3>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <button 
                  onClick={() => handleAddEdit(shop.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded text-sm focus:outline-none focus:shadow-outline w-full"
                >
                  Add/Edit Record
                </button>
                <button 
                  onClick={() => handleView(shop.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded text-sm focus:outline-none focus:shadow-outline w-full"
                >
                  View Record
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Records Table (Optional - if you want to show individual records) */}
      {records.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Daily Records</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-2 px-4 text-left">Shop</th>
                <th className="py-2 px-4 text-right">Lottery Qty</th>
                <th className="py-2 px-4 text-right">Total Worth</th>
                <th className="py-2 px-4 text-right">Cash Given</th>
                <th className="py-2 px-4 text-right">NLB Value</th>
                <th className="py-2 px-4 text-right">DLB Value</th>
                <th className="py-2 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const shop = shops.find(s => s.id === record.shop_id);
                return (
                  <tr key={record.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4">{shop ? shop.name : `Shop #${record.shop_id}`}</td>
                    <td className="py-2 px-4 text-right">{record.lottery_quantity}</td>
                    <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.total_worth)}</td>
                    <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.cash_given)}</td>
                    <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.nlb_total_price)}</td>
                    <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.dlb_total_price)}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {record.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
}