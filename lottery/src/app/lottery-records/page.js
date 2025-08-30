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
  const [showInactive, setShowInactive] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingProfit, setIsSavingProfit] = useState(false);
  const [existingProfit, setExistingProfit] = useState(null);
  const [isProfitSaved, setIsProfitSaved] = useState(false);
  
  // Special case tickets (bought at 31, sold at 34/35)
  const [specialTickets31to34, setSpecialTickets31to34] = useState(0);
  const [specialTickets31to35, setSpecialTickets31to35] = useState(0);
  
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
        const res = await fetch(`/api/shops?includeInactive=${showInactive}`);
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
  }, [router, showInactive]);

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

  // Calculate daily profit based on ticket price categories
  const calculateDailyProfit = () => {
    if (records.length === 0) return { kumaraProfit: 0, managerProfit: 0, totalProfit: 0 };

    // Group records by price per ticket (same logic as in the UI)
    const priceGroups = records.reduce((groups, record) => {
      const pricePerTicket = record.total_worth / record.lottery_quantity;
      if (!groups[pricePerTicket]) {
        groups[pricePerTicket] = {
          totalTickets: 0
        };
      }
      groups[pricePerTicket].totalTickets += record.lottery_quantity;
      return groups;
    }, {});

    let kumaraProfit = 0;
    let managerProfit = 0;

    // Calculate profits for each price category
    Object.entries(priceGroups).forEach(([price, data]) => {
      const ticketPrice = Number(price);
      
      if (ticketPrice === 34) {
        // For 34 price tickets: Kumara = 1, Manager = 0.5 per ticket
        // But subtract special case tickets
        const standardTickets34 = Math.max(0, data.totalTickets - specialTickets31to34);
        kumaraProfit += standardTickets34 * 1; // (34 - 32.5 = 1.5, but Kumara gets 1)
        managerProfit += standardTickets34 * 0.5; // Manager gets 0.5
        
        // Add special case profits for 31->34 tickets
        kumaraProfit += specialTickets31to34 * 3; // (34 - 31 = 3 for Kumara)
        managerProfit += specialTickets31to34 * 1; // 1 for Manager
      } else if (ticketPrice === 35) {
        // For 35 price tickets: Kumara = 1.5, Manager = 1 per ticket
        // But subtract special case tickets
        const standardTickets35 = Math.max(0, data.totalTickets - specialTickets31to35);
        kumaraProfit += standardTickets35 * 1.5; // (35 - 32.5 = 2.5, but Kumara gets 1.5)
        managerProfit += standardTickets35 * 1; // Manager gets 1
        
        // Add special case profits for 31->35 tickets
        kumaraProfit += specialTickets31to35 * 4; // (35 - 31 = 4 for Kumara)
        managerProfit += specialTickets31to35 * 1; // 1 for Manager
      } else {
        // For other prices, calculate based on standard formula (price - 32.5)
        const totalProfitPerTicket = ticketPrice - 32.5;
        // Distribute total profit proportionally (assuming 60% Kumara, 40% Manager for other prices)
        kumaraProfit += data.totalTickets * totalProfitPerTicket * 0.6;
        managerProfit += data.totalTickets * totalProfitPerTicket * 0.4;
      }
    });

    // Round to nearest whole numbers
    kumaraProfit = Math.round(kumaraProfit);
    managerProfit = Math.round(managerProfit);
    const totalProfit = kumaraProfit + managerProfit;

    return { kumaraProfit, managerProfit, totalProfit };
  };

  // Validate special ticket inputs
  const validateSpecialTickets = () => {
    const priceGroups = records.reduce((groups, record) => {
      const pricePerTicket = record.total_worth / record.lottery_quantity;
      if (!groups[pricePerTicket]) {
        groups[pricePerTicket] = { totalTickets: 0 };
      }
      groups[pricePerTicket].totalTickets += record.lottery_quantity;
      return groups;
    }, {});

    const available34 = priceGroups[34]?.totalTickets || 0;
    const available35 = priceGroups[35]?.totalTickets || 0;

    const errors = [];
    
    if (specialTickets31to34 > available34) {
      errors.push(`Special tickets 31→34 (${specialTickets31to34}) cannot exceed available 34-price tickets (${available34})`);
    }
    
    if (specialTickets31to35 > available35) {
      errors.push(`Special tickets 31→35 (${specialTickets31to35}) cannot exceed available 35-price tickets (${available35})`);
    }

    return errors;
  };

  // Save daily profit to API
  const handleSaveProfit = async () => {
    setIsSavingProfit(true);
    
    try {
      // Validate special ticket inputs first
      const validationErrors = validateSpecialTickets();
      if (validationErrors.length > 0) {
        alert('Validation Errors:\n' + validationErrors.join('\n'));
        setIsSavingProfit(false);
        return;
      }

      const { kumaraProfit, managerProfit, totalProfit } = calculateDailyProfit();
      
      const res = await fetch('/api/daily_profit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date,
          kumara_profit: kumaraProfit,
          manager_profit: managerProfit
        })
      });

      if (res.ok) {
        const responseData = await res.json();
        alert(`Daily profit saved successfully!\nKumara: Rs. ${formatCurrency(kumaraProfit)}\nManager: Rs. ${formatCurrency(managerProfit)}\nTotal: Rs. ${formatCurrency(totalProfit)}`);
        setExistingProfit({ kumaraProfit, managerProfit, totalProfit });
        setIsProfitSaved(true);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profit');
      }
    } catch (error) {
      console.error('Error saving daily profit:', error);
      alert(`Error saving daily profit: ${error.message}`);
    } finally {
      setIsSavingProfit(false);
    }
  };

  // Update existing profit record
  const handleUpdateProfit = async () => {
    setIsSavingProfit(true);
    
    try {
      // Validate special ticket inputs first
      const validationErrors = validateSpecialTickets();
      if (validationErrors.length > 0) {
        alert('Validation Errors:\n' + validationErrors.join('\n'));
        setIsSavingProfit(false);
        return;
      }

      const { kumaraProfit, managerProfit, totalProfit } = calculateDailyProfit();
      
      const res = await fetch('/api/daily_profit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date,
          kumara_profit: kumaraProfit,
          manager_profit: managerProfit
        })
      });

      if (res.ok) {
        alert(`Daily profit updated successfully!\nKumara: Rs. ${formatCurrency(kumaraProfit)}\nManager: Rs. ${formatCurrency(managerProfit)}\nTotal: Rs. ${formatCurrency(totalProfit)}`);
        setExistingProfit({ kumaraProfit, managerProfit, totalProfit });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profit');
      }
    } catch (error) {
      console.error('Error updating daily profit:', error);
      alert(`Error updating daily profit: ${error.message}`);
    } finally {
      setIsSavingProfit(false);
    }
  };

  // Fetch existing profit for the selected date
  const fetchExistingProfit = async (selectedDate) => {
    try {
      const res = await fetch(`/api/daily_profit?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const profitData = data[0];
          setExistingProfit({
            kumaraProfit: profitData.kumara_profit,
            managerProfit: profitData.manager_profit,
            totalProfit: profitData.total_profit
          });
          setIsProfitSaved(true);
        } else {
          setExistingProfit(null);
          setIsProfitSaved(false);
        }
      } else {
        setExistingProfit(null);
        setIsProfitSaved(false);
      }
    } catch (error) {
      console.error('Error fetching existing profit:', error);
      setExistingProfit(null);
      setIsProfitSaved(false);
    }
  };

  // Fetch daily note and profit
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
      fetchExistingProfit(date);
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

        {/* Save Profit Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Daily Profit
                  {isProfitSaved && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  Calculate and save profit based on ticket categories and special cases
                </p>
                
                {/* Special Tickets Input Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Special Tickets (Bought at Rs. 31)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Sold at Rs. 34:
                      </label>
                      <input
                        type="number"
                        value={specialTickets31to34}
                        onChange={(e) => setSpecialTickets31to34(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Quantity"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Sold at Rs. 35:
                      </label>
                      <input
                        type="number"
                        value={specialTickets31to35}
                        onChange={(e) => setSpecialTickets31to35(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Quantity"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {records.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {/* Current Calculated Profits */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Calculated Profits:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <span className="block text-xs text-gray-600">Kumara&apos;s Profit</span>
                          <span className="font-bold text-green-700">Rs. {formatCurrency(calculateDailyProfit().kumaraProfit)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs text-gray-600">Manager&apos;s Profit</span>
                          <span className="font-bold text-blue-700">Rs. {formatCurrency(calculateDailyProfit().managerProfit)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs text-gray-600">Total Profit</span>
                          <span className="font-bold text-purple-700">Rs. {formatCurrency(calculateDailyProfit().totalProfit)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Saved Profits (if exists) */}
                    {isProfitSaved && existingProfit !== null && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">Saved Profits:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <span className="block text-xs text-gray-600">Kumara&apos;s Profit</span>
                            <span className="font-bold text-green-700">Rs. {formatCurrency(existingProfit.kumaraProfit)}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-xs text-gray-600">Manager&apos;s Profit</span>
                            <span className="font-bold text-blue-700">Rs. {formatCurrency(existingProfit.managerProfit)}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-xs text-gray-600">Total Profit</span>
                            <span className="font-bold text-purple-700">Rs. {formatCurrency(existingProfit.totalProfit)}</span>
                          </div>
                        </div>
                        {(calculateDailyProfit().totalProfit !== existingProfit.totalProfit) && (
                          <p className="text-xs text-orange-600 font-medium mt-2 text-center">
                            (Different from current calculation)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isProfitSaved ? (
                  <button
                    onClick={handleSaveProfit}
                    disabled={isSavingProfit || records.length === 0}
                    className={`${
                      isSavingProfit || records.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } transition-colors text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm flex items-center gap-2`}
                  >
                    {isSavingProfit ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Profit
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleUpdateProfit}
                      disabled={isSavingProfit || records.length === 0}
                      className={`${
                        isSavingProfit || records.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } transition-colors text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm flex items-center gap-2`}
                    >
                      {isSavingProfit ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Update Profit
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfitSaved(false);
                        setExistingProfit(null);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 transition-colors text-white font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shops Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Left Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Shops
                  </h2>
                  <div className="block sm:hidden">
                    <button
                      onClick={() => router.push('/manage-shops')}
                      className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Manage
                    </button>
                  </div>
                </div>
                
                <label htmlFor="showInactive" className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm px-2 font-medium text-gray-700 select-none">Show inactive shops</span>
                </label>
              </div>

              {/* Right Section - Hidden on mobile, shown on desktop */}
              <div className="hidden sm:block">
                <button
                  onClick={() => router.push('/manage-shops')}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Manage Shops
                </button>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${!shop.active ? 'opacity-75' : ''}`}
              >
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate">{shop.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${shop.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {shop.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
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