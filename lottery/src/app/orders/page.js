'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/navbar';
// Helper function to get the next two dates after a given date
function getNextTwoDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 1; i <= 2; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(formatLocalDate(date));
    }
    return dates;
}

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function Orders() {
    const [isEditing, setIsEditing] = useState(false);
    const [lotteryTypes, setLotteryTypes] = useState([]);
    const [defaultQuantities, setDefaultQuantities] = useState({});
    const [dailyOrders, setDailyOrders] = useState({});
    const [loading, setLoading] = useState(false);

    // Set initial dates: today, tomorrow, and the day after tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const initialDates = [
        formatLocalDate(today),
        formatLocalDate(tomorrow),
        formatLocalDate(dayAfterTomorrow),
    ];

    const [dates, setDates] = useState(initialDates);
    const [originalDates, setOriginalDates] = useState(initialDates);
    const [originalDailyOrders, setOriginalDailyOrders] = useState({});

    // Fetch initial data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [lotteryTypesRes, defaultQuantitiesRes] = await Promise.all([
                    fetch('/api/lottery_types').then(res => res.json()),
                    fetch('/api/default_quantities').then(res => res.json()),
                ]);
                
                setLotteryTypes(lotteryTypesRes);
                setDefaultQuantities(defaultQuantitiesRes);
    
                await fetchDailyOrders(initialDates, lotteryTypesRes, defaultQuantitiesRes);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch daily orders when dates are set
    const fetchDailyOrders = async (newDates, lotteryTypesData, defaultQuantitiesData) => {
        const validDates = newDates.filter(date => date !== '');
        if (validDates.length === 0) return;
        
        setLoading(true);
        try {
            const dailyOrdersRes = await fetch(`/api/daily_orders?dates=${validDates.join(',')}`).then(res => res.json());
    
            // Normalize the keys in dailyOrdersRes to yyyy-mm-dd format
            const normalizedDailyOrders = {};
            Object.keys(dailyOrdersRes).forEach(dateStr => {
                const date = new Date(dateStr);
                const formattedDate = date.toISOString().split('T')[0];
                normalizedDailyOrders[formattedDate] = dailyOrdersRes[dateStr];
            });
    
            const initialDailyOrders = {};
            newDates.forEach(date => {
                if (date) {
                    initialDailyOrders[date] = {};
                    lotteryTypesData.forEach(lt => {
                        initialDailyOrders[date][lt.id] = normalizedDailyOrders[date]?.[lt.id] || defaultQuantitiesData[lt.id] || 0;
                    });
                }
            });
            setDailyOrders(initialDailyOrders);
            setOriginalDailyOrders(JSON.parse(JSON.stringify(initialDailyOrders)));
        } catch (error) {
            console.error('Error fetching daily orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle date change for Day 1 (auto-sets Days 2 and 3)
    const handleDateChange = (index, value) => {
        const newDates = [...dates];
        newDates[index] = value;
        if (index === 0 && value) {
            const nextDates = getNextTwoDates(value);
            newDates[1] = nextDates[0];
            newDates[2] = nextDates[1];
        }
        setDates(newDates);
        fetchDailyOrders(newDates, lotteryTypes, defaultQuantities);
    };

    // Toggle edit mode
    const handleEdit = () => {
        setOriginalDates([...dates]);
        setIsEditing(true);
    };

    // Cancel edits and revert to original state
    const handleCancel = () => {
        setDates(originalDates);
        setDailyOrders(originalDailyOrders);
        setIsEditing(false);
    };

    // Save changes to the server
    const handleSave = async () => {
        const ordersToSave = [];
        Object.keys(dailyOrders).forEach(date => {
            Object.keys(dailyOrders[date]).forEach(ltId => {
                ordersToSave.push({
                    date,
                    lottery_type_id: parseInt(ltId),
                    quantity: dailyOrders[date][ltId],
                });
            });
        });
        try {
            const res = await fetch('/api/daily_orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ordersToSave),
            });
            if (res.ok) {
                alert('Orders saved successfully');
                setOriginalDailyOrders(JSON.parse(JSON.stringify(dailyOrders)));
                setOriginalDates([...dates]);
                setIsEditing(false);
            } else {

                alert('Failed to save orders');
            }
        } catch (error) {
            console.error('Error saving orders:', error);
            alert('Error saving orders');
        }
    };

    // Update quantity in state during editing
    const handleQuantityChange = (date, ltId, value) => {
        const newQuantity = parseInt(value) || 0;
        setDailyOrders(prev => ({
            ...prev,
            [date]: { ...prev[date], [ltId]: newQuantity },
        }));
    };

    // Calculate total for a day in a category
    const calculateDayTotal = (date, category) => {
        const ltIds = lotteryTypes.filter(lt => lt.category === category).map(lt => lt.id);
        return ltIds.reduce((sum, ltId) => {
            const quantity = Number(dailyOrders[date]?.[ltId] || 0);
            return sum + quantity;
        }, 0);
    };

    // Format date for display
    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return 'Select Date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Render table for a category (NLB or DLB)
    const renderTable = (category) => {
        const filteredLotteries = lotteryTypes.filter(lt => lt.category === category);
        const bgColor = category === 'NLB' ? 'bg-amber-100' : 'bg-red-100';
        const headerBg = category === 'NLB' ? 'bg-amber-200' : 'bg-red-200';
        
        return (
            
            <div className="w-full lg:w-1/2 p-2">
                <h2 className={`text-xl font-bold mb-2 ${category === 'NLB' ? 'text-amber-800' : 'text-red-800'}`}>{category}</h2>
                <div className="overflow-x-auto">
                    <table className={`w-full border-collapse ${bgColor} rounded-lg overflow-hidden`}>
                        <thead>
                            <tr className={`${headerBg}`}>
                                <th className="border border-gray-300 p-2 text-left">Lottery</th>
                                {dates.map((date, idx) => (
                                    <th key={idx} className="border border-gray-300 p-2">
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => handleDateChange(idx, e.target.value)}
                                                className="w-full p-1 rounded"
                                            />
                                        ) : (
                                            formatDateForDisplay(date)
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLotteries.map(lt => (
                                <tr key={lt.id} className="hover:bg-white/50 transition-colors">
                                    <td className="border border-gray-300 p-2">{lt.name}</td>
                                    {dates.map((date, idx) => (
                                        <td key={`${date}-${idx}`} className="border border-gray-300 p-2 text-right">
                                            {isEditing && date ? (
                                                <input
                                                    type="number"
                                                    value={dailyOrders[date]?.[lt.id] || 0}
                                                    onChange={(e) => handleQuantityChange(date, lt.id, e.target.value)}
                                                    className="w-16 p-1 text-right rounded"
                                                    min="0"
                                                />
                                            ) : (
                                                (date && dailyOrders[date]?.[lt.id]) || 0
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr className="bg-green-100 font-bold">
                                <td className="border border-gray-300 p-2">Total</td>
                                {dates.map((date, idx) => (
                                    <td key={`total-${idx}`} className="border border-gray-300 p-2 text-right">
                                        {date ? calculateDayTotal(date, category) : 0}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Header/>
        <div className="container mx-auto px-4 py-6 max-w-6xl">

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Orders for Next Three Days</h1>
                    <div>
                        {!isEditing ? (
                            <button 
                                onClick={handleEdit} 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="space-x-2">
                                <button 
                                    onClick={handleSave} 
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={handleCancel} 
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="flex flex-wrap -mx-2">
                        {renderTable('NLB')}
                        {renderTable('DLB')}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}