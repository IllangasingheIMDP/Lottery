'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/navbar';
export default function OrderingDetails() {
  // State variables
  const [shops, setShops] = useState([]);
  const [nlbLotteries, setNlbLotteries] = useState([]);
  const [dlbLotteries, setDlbLotteries] = useState([]);
  const [ordersMap, setOrdersMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [originalOrders, setOriginalOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // For mobile view - 'all', 'nlb', or 'dlb'

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsRes, lotteryTypesRes, ordersRes] = await Promise.all([
          fetch('/api/shops').then(res => res.json()),
          fetch('/api/lottery_types').then(res => res.json()),
          fetch('/api/orders').then(res => res.json()),
        ]);
        setShops(shopsRes);
        const nlb = lotteryTypesRes.filter(lt => lt.category === 'NLB');
        const dlb = lotteryTypesRes.filter(lt => lt.category === 'DLB');
        setNlbLotteries(nlb);
        setDlbLotteries(dlb);

        // Transform orders into a nested object for easy access
        const ordersMap = {};
        shopsRes.forEach(shop => {
          ordersMap[shop.id] = {};
          [...nlb, ...dlb].forEach(lt => {
            const order = ordersRes.find(
              o => o.shop_id === shop.id && o.lottery_type_id === lt.id
            );
            ordersMap[shop.id][lt.id] = order ? order.quantity : 0;
          });
        });
        setOrdersMap(ordersMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Handle entering edit mode
  const handleEdit = () => {
    setOriginalOrders(JSON.parse(JSON.stringify(ordersMap))); // Deep copy
    setIsEditing(true);
  };

  // Handle canceling edits
  const handleCancel = () => {
    setOrdersMap(originalOrders);
    setIsEditing(false);
  };

  // Handle saving edits
  const handleSave = async () => {
    const ordersToSave = [];
    Object.entries(ordersMap).forEach(([shopId, shopOrders]) => {
      Object.entries(shopOrders).forEach(([lotteryTypeId, quantity]) => {
        ordersToSave.push({
          shop_id: parseInt(shopId),
          lottery_type_id: parseInt(lotteryTypeId),
          quantity,
        });
      });
    });
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordersToSave),
      });
      if (res.ok) {
        alert('Orders saved successfully');
        setIsEditing(false); // Exit edit mode after successful save
      } else {
        alert('Failed to save orders');
      }
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  };

  // Calculate totals for a single shop
  const calculateShopTotals = (shopId) => {
    const shopOrders = ordersMap[shopId] || {};
    const nlbTotal = nlbLotteries.reduce((sum, lt) => sum + (shopOrders[lt.id] || 0), 0);
    const dlbTotal = dlbLotteries.reduce((sum, lt) => sum + (shopOrders[lt.id] || 0), 0);
    const totalTickets = nlbTotal + dlbTotal;
    return { nlbTotal, dlbTotal, totalTickets };
  };

  // Calculate column totals across all shops
  const calculateColumnTotals = () => {
    const columnTotals = {};
    [...nlbLotteries, ...dlbLotteries].forEach(lt => {
      columnTotals[lt.id] = shops.reduce(
        (sum, shop) => sum + (ordersMap[shop.id]?.[lt.id] || 0),
        0
      );
    });
    const nlbGrandTotal = nlbLotteries.reduce((sum, lt) => sum + columnTotals[lt.id], 0);
    const dlbGrandTotal = dlbLotteries.reduce((sum, lt) => sum + columnTotals[lt.id], 0);
    const totalTickets = nlbGrandTotal + dlbGrandTotal;
    return { columnTotals, nlbGrandTotal, dlbGrandTotal, totalTickets };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { columnTotals, nlbGrandTotal, dlbGrandTotal, totalTickets } = calculateColumnTotals();

  const renderMobileTable = () => {
    const renderLotteryRows = (lotteries, category) => {
      return shops.map(shop => {
        return lotteries.map(lt => (
          <tr key={`${shop.id}-${lt.id}`} className="border-b">
            {lotteries === nlbLotteries && lt === nlbLotteries[0] && (
              <td rowSpan={nlbLotteries.length} className="px-2 py-2 border-r bg-gray-50 align-top">
                {shop.name}
              </td>
            )}
            {lotteries === dlbLotteries && lt === dlbLotteries[0] && (
              <td rowSpan={dlbLotteries.length} className="px-2 py-2 border-r bg-gray-50 align-top">
                {shop.name}
              </td>
            )}
            <td className="px-2 py-2 border-r">{lt.name}</td>
            <td className="px-2 py-2 text-right">
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={ordersMap[shop.id][lt.id]}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 0;
                    setOrdersMap(prev => ({
                      ...prev,
                      [shop.id]: { ...prev[shop.id], [lt.id]: newQuantity },
                    }));
                  }}
                  className="w-16 p-1 text-right border rounded"
                />
              ) : (
                ordersMap[shop.id][lt.id]
              )}
            </td>
          </tr>
        ));
      });
    };

    return (
      <div className="mt-4">
        {/* Tabs for mobile */}
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'nlb' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('nlb')}
          >
            NLB
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'dlb' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('dlb')}
          >
            DLB
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-100 p-3 rounded shadow">
            <div className="text-xs uppercase text-gray-600">NLB Total</div>
            <div className="text-xl font-bold">{nlbGrandTotal}</div>
          </div>
          <div className="bg-green-100 p-3 rounded shadow">
            <div className="text-xs uppercase text-gray-600">DLB Total</div>
            <div className="text-xl font-bold">{dlbGrandTotal}</div>
          </div>
          <div className="bg-amber-100 p-3 rounded shadow">
            <div className="text-xs uppercase text-gray-600">All Tickets</div>
            <div className="text-xl font-bold">{totalTickets}</div>
          </div>
        </div>

        {/* Shop summary */}
        {(activeTab === 'all') && shops.map(shop => {
          const { nlbTotal, dlbTotal, totalTickets } = calculateShopTotals(shop.id);
          return (
            <div key={shop.id} className="bg-white mb-4 border rounded overflow-hidden">
              <div className="bg-gray-100 p-2 font-medium border-b">{shop.name}</div>
              <div className="grid grid-cols-3 divide-x">
                <div className="p-2">
                  <div className="text-xs text-gray-500">NLB</div>
                  <div className="text-lg font-semibold">{nlbTotal}</div>
                </div>
                <div className="p-2">
                  <div className="text-xs text-gray-500">DLB</div>
                  <div className="text-lg font-semibold">{dlbTotal}</div>
                </div>
                <div className="p-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-semibold">{totalTickets}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* NLB detail table */}
        {(activeTab === 'nlb' || activeTab === 'all') && (
          <div className="mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">NLB Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-2 py-2 border text-left">Shop</th>
                    <th className="px-2 py-2 border text-left">Lottery</th>
                    <th className="px-2 py-2 border text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {renderLotteryRows(nlbLotteries, 'NLB')}
                  <tr className="bg-blue-100 font-semibold">
                    <td colSpan="2" className="px-2 py-2 border">Total NLB</td>
                    <td className="px-2 py-2 border text-right">{nlbGrandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DLB detail table */}
        {(activeTab === 'dlb' || activeTab === 'all') && (
          <div>
            <h3 className="font-semibold text-green-800 mb-2">DLB Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-2 py-2 border text-left">Shop</th>
                    <th className="px-2 py-2 border text-left">Lottery</th>
                    <th className="px-2 py-2 border text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {renderLotteryRows(dlbLotteries, 'DLB')}
                  <tr className="bg-green-100 font-semibold">
                    <td colSpan="2" className="px-2 py-2 border">Total DLB</td>
                    <td className="px-2 py-2 border text-right">{dlbGrandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDesktopTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border text-left">Shop</th>
              {/* NLB Headers */}
              {nlbLotteries.length > 0 && (
                <>
                  <th colSpan={nlbLotteries.length} className="border text-center bg-blue-50">
                    NLB Lotteries
                  </th>
                  <th rowSpan="2" className="px-4 py-2 border text-center bg-blue-100">
                    NLB Total
                  </th>
                </>
              )}
              {/* DLB Headers */}
              {dlbLotteries.length > 0 && (
                <>
                  <th colSpan={dlbLotteries.length} className="border text-center bg-green-50">
                    DLB Lotteries
                  </th>
                  <th rowSpan="2" className="px-4 py-2 border text-center bg-green-100">
                    DLB Total
                  </th>
                </>
              )}
              <th rowSpan="2" className="px-4 py-2 border text-center bg-amber-100">
                Total Tickets
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border"></th>
              {/* NLB Lottery Names */}
              {nlbLotteries.map(lt => (
                <th key={lt.id} className="px-2 py-2 border text-center bg-blue-50">
                  {lt.name}
                </th>
              ))}
              {/* DLB Lottery Names */}
              {dlbLotteries.map(lt => (
                <th key={lt.id} className="px-2 py-2 border text-center bg-green-50">
                  {lt.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shops.map(shop => {
              const { nlbTotal, dlbTotal, totalTickets } = calculateShopTotals(shop.id);
              return (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border font-medium">{shop.name}</td>
                  {/* NLB Lottery Columns */}
                  {nlbLotteries.map(lt => (
                    <td key={lt.id} className="px-2 py-2 border text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={ordersMap[shop.id][lt.id]}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            setOrdersMap(prev => ({
                              ...prev,
                              [shop.id]: { ...prev[shop.id], [lt.id]: newQuantity },
                            }));
                          }}
                          className="w-16 p-1 text-right border rounded"
                        />
                      ) : (
                        ordersMap[shop.id][lt.id]
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2 border text-center font-medium bg-blue-50">
                    {nlbTotal}
                  </td>
                  {/* DLB Lottery Columns */}
                  {dlbLotteries.map(lt => (
                    <td key={lt.id} className="px-2 py-2 border text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={ordersMap[shop.id][lt.id]}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            setOrdersMap(prev => ({
                              ...prev,
                              [shop.id]: { ...prev[shop.id], [lt.id]: newQuantity },
                            }));
                          }}
                          className="w-16 p-1 text-right border rounded"
                        />
                      ) : (
                        ordersMap[shop.id][lt.id]
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2 border text-center font-medium bg-green-50">
                    {dlbTotal}
                  </td>
                  <td className="px-4 py-2 border text-center font-medium bg-amber-50">
                    {totalTickets}
                  </td>
                </tr>
              );
            })}
            {/* Footer Row */}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-4 py-2 border">Totals</td>
              {nlbLotteries.map(lt => (
                <td key={lt.id} className="px-2 py-2 border text-center">
                  {columnTotals[lt.id]}
                </td>
              ))}
              <td className="px-4 py-2 border text-center bg-blue-200">{nlbGrandTotal}</td>
              {dlbLotteries.map(lt => (
                <td key={lt.id} className="px-2 py-2 border text-center">
                  {columnTotals[lt.id]}
                </td>
              ))}
              <td className="px-4 py-2 border text-center bg-green-200">{dlbGrandTotal}</td>
              <td className="px-4 py-2 border text-center bg-amber-200">{totalTickets}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
        <Header />
    <div className="max-w-full px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Lottery Ordering Details</h1>
        <div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit Orders
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive layout */}
      <div className="hidden md:block">
        {renderDesktopTable()}
      </div>
      <div className="md:hidden">
        {renderMobileTable()}
      </div>
    </div>
    </div>
  );
}