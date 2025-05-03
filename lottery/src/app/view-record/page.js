'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/navbar';
import { Suspense } from 'react';
export default function ViewRecord({searchParams}) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  //const searchParams = useSearchParams();
  const shopId = searchParams.shopId;
  const date = searchParams.date;

  useEffect(() => {
    if (shopId && date) {
      setLoading(true);
      fetch(`/api/daily_records?shop_id=${shopId}&date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setRecord(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching record:', error);
          setLoading(false);
        });
    }
  }, [shopId, date]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rs. 0.00';
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
      </Suspense>
    );
  }

  if (!record) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
      <div className="max-w-4xl mx-auto mt-16 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-red-700">වාර්තාව හමු නොවීය. කරුණාකර සාප්පු හැඳුනුම්පත සහ දිනය පරීක්ෂා කරන්න.</p>
          <button
            onClick={() => router.push('/lottery-records?date=' + date)}  
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Records
          </button>
        </div>
      </div>
      </Suspense>
    );
  }

  return (<Suspense fallback={<div>Loading...</div>}>
    <div className="min-h-screen bg-gray-100">
      <Header />
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {record.name} - Lottery Record
            </h1>
            <span className="inline-block bg-blue-900 rounded-full px-3 py-1 text-sm font-semibold text-white mt-2 sm:mt-0">
              {formatDate(record.date)}
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-gray-500 text-sm">Record ID:</span>
              <span className="ml-2 font-semibold">#{record.id}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/add-edit-record?shopId=${shopId}&date=${date}`)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => router.push('/lottery-records?date=' + date)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {record.completed ? 'Completed' : 'Pending'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.equality_check ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {record.equality_check ? 'සමතුලිතයි' : 'සමතුලිත නොවේ'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Step {record.step}/6
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Lottery Information */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-800">Lottery Information</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">ලොතරැයි ටිකට් එකක මිල:</span>
                <span className="font-medium">{formatCurrency(record.price_per_lottery)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">ලොතරැයි ප්රමාණය:</span>
                <span className="font-medium">{record.lottery_quantity}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">දී ඇති ටිකට්වල මුළු වටිනාකම:</span>
                <span className="font-medium text-green-600">{formatCurrency(record.total_worth)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">මුළු මුදල ගැලපීම:</span>
                {Number(record.total_worth) == (Number(record.got_tickets_total_price) + Number(record.cash_given)+Number(record.faulty_total_price)) ? <span className="font-medium text-blue-600"></span> : <span className="font-medium text-red-600"> {Number(record.total_worth) - (Number(record.got_tickets_total_price) + Number(record.cash_given)+Number(record.faulty_total_price))} </span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">විශේෂ සටහන්:</span>
                <span className="font-medium italic">{record.special_lotteries_note || "None"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Financial Information */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-800">Financial Information</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">මුදලින් ලැබුණු මුදල:</span>
                <span className="font-medium">{formatCurrency(record.cash_given)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">ටිකට්පත් මගින් ලැබුණු මුදල:</span>
                <span className="font-medium">{formatCurrency(record.got_tickets_total_price)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">මුළු NLB මිල:</span>
                <span className="font-medium">{formatCurrency(record.nlb_total_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">මුළු DLB මිල:</span>
                <span className="font-medium">{formatCurrency(record.dlb_total_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ගැලපීම:</span>
                <span className={`font-bold ${record.equality_check ? 'text-green-700' : 'text-red-500' }`}>{record.equality_check ? "ටිකට් මුදල් ගැලපේ":"ටිකට් පත නොගැලපේ."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">මුළු ලැබුණු මිල:</span>
                <span className="font-medium text-purple-600">{formatCurrency(Number(record.got_tickets_total_price) + Number(record.cash_given))}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 3: NLB Lottery Breakdown */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-800">NLB විශ්ලේෂණය</h2>
          </div>
          <div className="p-4">
            {Object.keys(record.nlb).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(record.nlb).map(([price, quantity]) => (
                  <div key={price} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Rs. {price} Ticket:</span>
                    <span className="font-medium">{quantity} pcs</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 font-semibold">Total:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(record.nlb_total_price)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">NLB ලොතරැයි ටිකට්පත් කිසිවක් ලියාපදිංචි කර නොමැත.</p>
            )}
          </div>
        </div>
        
        {/* Card 4: DLB Lottery Breakdown */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-800">DLB විශ්ලේෂණය</h2>
          </div>
          <div className="p-4">
            {Object.keys(record.dlb).some(key => record.dlb[key] > 0) ? (
              <div className="space-y-3">
                {Object.entries(record.dlb).map(([price, quantity]) => (
                  <div key={price} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Rs. {price} Ticket:</span>
                    <span className="font-medium">{quantity} pcs</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 font-semibold">Total:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(record.dlb_total_price)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">DLB ලොතරැයි ටිකට්පත් කිසිවක් ලියාපදිංචි කර නොමැත.</p>
            )}
          </div>
        </div>
        
        {/* Card 5: Faulty Tickets */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden md:col-span-2">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-800">දෝෂ සහිත ටිකට්පත්</h2>
          </div>
          <div className="p-4">
            {Object.keys(record.faulty).some(key => record.faulty[key] > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(record.faulty).map(([price, quantity]) => (
                  <div key={price} className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600">Rs. {price} Ticket:</div>
                    <div className="font-medium">{quantity} pcs</div>
                  </div>
                ))}
                <div className="bg-red-50 p-3 rounded sm:col-span-2 md:col-span-3">
                  <div className="font-semibold text-red-700">සම්පූර්ණ දෝෂ සහිත අගය:</div>
                  <div className="font-medium">{formatCurrency(record.faulty_total_price)}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">දෝෂ සහිත ටිකට්පත් වාර්තා කර නොමැත</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => router.push('/lottery-records?date=' + date)}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
        >
          Back to Records
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={() => router.push(`/add-edit-record?shopId=${shopId}&date=${date}`)}
            className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Record
          </button>
        </div>
      </div>
    </div>
  </div>
  </Suspense>
  );
}