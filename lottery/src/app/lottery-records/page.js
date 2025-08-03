'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/navbar';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
function LotteryRecordsContent() {
  // const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const searchParams = useSearchParams();
  const [date, setDate] = useState(() => {
    // Initialize with URL param or today's date
    const urlDate = searchParams.get('date');
    return urlDate || new Date().toISOString().split('T')[0];
  });
  const [shops, setShops] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateReceived = searchParams.date;
  // Add to the existing useState declarations
  const [loanTotal, setLoanTotal] = useState(0);


  useEffect(() => {
    if (dateReceived) {
      //console.log(dateReceived);
      setDate(dateReceived);
    }
  }, [dateReceived]);
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

  const [orderedCount, setOrderedCount] = useState({});
  const [dailyNote, setDailyNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const router = useRouter();

  const fetchLoanRecords = async (selectedDate) => {
    try {
      const res = await fetch(`/api/loans?date=${selectedDate}&type=loan_records`);
      console.log(res);
      if (res.ok) {
        const data = await res.json();
        setLoanTotal(data.total_amount || 0);
      }
    } catch (error) {
      console.error('Error fetching loan records:', error);
      setLoanTotal(0);
    }
  };
  useEffect(() => {
    const validDates = [date];
    const fetchDailyOrders = async () => {
      const dailyOrdersRes = await fetch(`/api/daily_orders?dates=${validDates.join(',')}`).then(res => res.json());
      if (dailyOrdersRes[date]) {
        const sum = Object.values(dailyOrdersRes[date]).reduce((total, value) => total + value, 0);
        console.log(sum);
        setOrderedCount(prev => ({ ...prev, [date]: sum }));
      }

    }
    fetchDailyOrders();
  }, [date]);

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

  const calculateTicketCount = (ticketObj) => {
    if (!ticketObj) return 0;
    return Object.entries(ticketObj).reduce((total, [denomination, count]) => {
      if (denomination !== '0') { // Skip if denomination is 0
        return total + parseInt(count || 0);
      }
      return total;
    }, 0);
  };
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/daily_records/all?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          const enrichedData = data.map(record => ({
            ...record,
            nlb_quantity: calculateTicketCount(record.nlb),
            dlb_quantity: calculateTicketCount(record.dlb),
          }));
          setRecords(enrichedData);
          calculateSummaries(enrichedData);
        }
        // Fetch loan records
        await fetchLoanRecords(date);
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

  // Fetch daily note
  useEffect(() => {
    const fetchDailyNote = async () => {
      try {
        const res = await fetch(`/api/daily_notes?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setDailyNote(data.note || '');
        }
      } catch (error) {
        console.error('Error fetching daily note:', error);
      }
    };

    if (date) {
      fetchDailyNote();
    }
  }, [date]);

  // Create or update daily note
  const handleSaveNote = async () => {
    try {
      const res = await fetch('/api/daily_notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          note: dailyNote
        }),
      });

      if (res.ok) {
        setIsEditingNote(false);
      } else {
        console.error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Delete daily note
  const handleDeleteNote = async () => {
    try {
      const res = await fetch(`/api/daily_notes?date=${date}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDailyNote('');
        setIsEditingNote(false);
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Calculate total tickets given
  const calculateTotalTicketsGiven = () => {
    return records.reduce((total, record) => total + (record.lottery_quantity || 0), 0);
  };

  // Calculate ticket difference
  const calculateTicketDifference = () => {
    const totalGiven = calculateTotalTicketsGiven();
    const ordered = orderedCount[date] || 0;
    return ordered - totalGiven;
  };

  return (

    <div>

      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Lottery Records</h1>


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
                    <span className="text-gray-600">දී ඇති ටිකට්වල මුළු වටිනාකම:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.totalWorth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">මුදලින් ලැබුණු මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.totalCashGiven)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ටිකට්පත් මගින් ලැබුණු මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.totalTicketsPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ලැබුණු මුළු මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.totalMoney)}</span>
                  </div>
                </div>
              </div>

              {/* NLB Tickets Card */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-xl font-semibold mb-4 text-green-800">NLB Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NLB ටිකට් ගණන:</span>
                    <span className="font-medium">{summaries.nlbTicketsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NLB මුළු මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.nlbTotalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* DLB Tickets Card */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold mb-4 text-purple-800">DLB Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">DLB ටිකට් ගණන:</span>
                    <span className="font-medium">{summaries.dlbTicketsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DLB මුළු මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.dlbTotalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Tickets Summary Card */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <h3 className="text-xl font-semibold mb-4 text-yellow-800">Tickets Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">වැරදි ටිකට් මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(summaries.faultyTotalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ලැබුණු ණය මුදල:</span>
                    <span className="font-medium">Rs. {formatCurrency(loanTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <h3 className="text-xl font-semibold mb-4 text-indigo-800">Ticket Price Categories</h3>
                <div className="space-y-4">
                  {records.length > 0 && (() => {
                    // Group records by price per ticket
                    const priceGroups = records.reduce((groups, record) => {
                      const pricePerTicket = record.total_worth / record.lottery_quantity;
                      if (!groups[pricePerTicket]) {
                        groups[pricePerTicket] = {
                          totalTickets: 0,
                          shops: new Set(),
                          shopNames: []
                        };
                      }
                      groups[pricePerTicket].totalTickets += record.lottery_quantity;
                      groups[pricePerTicket].shops.add(record.shop_id);
                      const shopName = shops.find(s => s.id === record.shop_id)?.name || `Shop #${record.shop_id}`;
                      if (!groups[pricePerTicket].shopNames.includes(shopName)) {
                        groups[pricePerTicket].shopNames.push(shopName);
                      }
                      return groups;
                    }, {});

                    return Object.entries(priceGroups)
                      .sort(([priceA], [priceB]) => Number(priceA) - Number(priceB))
                      .map(([price, data]) => (
                        <div key={price} className="border-b pb-3 last:border-b-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 font-medium">Rs. {formatCurrency(price)} ටිකට්:</span>
                            <span className="font-medium">{data.totalTickets} ක්</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="block">සාප්පු ({data.shops.size}): </span>
                            <span className="text-gray-600">{data.shopNames.join(', ')}</span>
                          </div>
                        </div>
                      ));
                  })()}
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
            {/* Price per ticket,tickets count,shops */}
        {/* Records Table (Optional - if you want to show individual records) */}
        {records.length > 0 && (
          <div className="overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">Daily Records</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">Shop</th>
                  <th className="py-2 px-4 text-right">ටිකට් ගණන</th>
                  <th className="py-2 px-4 text-right">දී ඇති ටිකට්වල මුළු වටිනාකම</th>
                  <th className="py-2 px-4 text-right">මුදලින් ලැබුණු මුදල</th>
                  <th className="py-2 px-4 text-right">NLB ටිකට් ගණන </th>
                  <th className="py-2 px-4 text-right">NLB මුදල</th>
                  <th className="py-2 px-4 text-right">DLB ටිකට් ගණන </th>
                  <th className="py-2 px-4 text-right">DLB මුදල</th>
                  <th className="py-2 px-4 text-right">ටිකට්පත් මගින් ලැබුණු මුදල</th>
                  <th className="py-2 px-4 text-right">දෝෂ සහිත අගය</th>
                  <th className="py-2 px-4 text-right">මුළු මුදල ගැලපීම</th>
                  <th className="py-2 px-4 text-center">Process Status</th>
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
                      <td className="py-2 px-4 text-right">{record.nlb_quantity}</td>
                      <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.nlb_total_price)}</td>
                      <td className="py-2 px-4 text-right">{record.dlb_quantity}</td>
                      <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.dlb_total_price)}</td>
                      <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.got_tickets_total_price)}</td>
                      <td className="py-2 px-4 text-right">Rs. {formatCurrency(record.faulty_total_price)}</td>
                      <td className="py-2 px-4 text-center">{Number(record.total_worth) == (Number(record.cash_given) + Number(record.nlb_total_price) + Number(record.dlb_total_price) + Number(record.faulty_total_price)) ? <p className='text-green-600'>Yes</p> : <p className='text-red-600'>{Number(record.total_worth) - (Number(record.cash_given) + Number(record.nlb_total_price) + Number(record.dlb_total_price) + Number(record.faulty_total_price))}</p>}</td>
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
        {/* Daily Note Section */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Tickets Balance</h2>

          {/* Ticket Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ඇණවුම් කළ ටිකට්පත්:</span>
                  <span className="font-medium text-lg">{orderedCount[date] || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">ලබා දුන් ටිකට්පත්:</span>
                  <span className="font-medium text-lg">{calculateTotalTicketsGiven()}</span>
                </div>
                {(() => {
                  const difference = calculateTicketDifference();
                  if (difference > 0) {
                    return (
                      <div className="flex justify-between items-center text-green-600">
                        <span>ඉතිරිව ඇති ටිකට්පත්:</span>
                        <span className="font-medium text-lg">{difference}</span>
                      </div>
                    );
                  } else if (difference < 0) {
                    return (
                      <div className="flex justify-between items-center text-red-600">
                        <span>ලැබුණු අමතර ටිකට්පත්:</span>
                        <span className="font-medium text-lg">{Math.abs(difference)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Daily Note */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-700 font-medium">Daily Note</h3>
                {!isEditingNote ? (
                  <button
                    onClick={() => setIsEditingNote(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleSaveNote}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-1 px-3 rounded flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingNote(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-1 px-3 rounded flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                    {dailyNote && (
                      <button
                        onClick={handleDeleteNote}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditingNote ? (
                <textarea
                  value={dailyNote}
                  onChange={(e) => setDailyNote(e.target.value)}
                  className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your note here..."
                />
              ) : (
                <div className="min-h-[8rem] p-3 bg-white rounded-lg border">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {dailyNote || 'No note for this date'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

    </div>

  );
}
export default function LotteryRecords() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LotteryRecordsContent />
    </Suspense>
  );
}