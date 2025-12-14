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
    const [orderingNotes, setOrderingNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [shops, setShops] = useState([]);

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
                const [lotteryTypesRes, defaultQuantitiesRes, shopsRes] = await Promise.all([
                    fetch('/api/lottery_types').then(res => res.json()),
                    fetch('/api/default_quantities').then(res => res.json()),
                    fetch('/api/shops').then(res => res.json()),
                ]);
                
                setLotteryTypes(lotteryTypesRes);
                setDefaultQuantities(defaultQuantitiesRes);
                setShops(shopsRes);
    
                await fetchDailyOrders(initialDates, lotteryTypesRes, defaultQuantitiesRes);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Build daily orders purely from distribution totals (no existing orders lookup)
    const fetchDailyOrders = async (newDates, lotteryTypesData, defaultQuantitiesData) => {
        const validDates = newDates.filter(date => date !== '');
        if (validDates.length === 0) return;

        setLoading(true);
        try {
            // Start with defaults for all lotteries per date
            const initialDailyOrders = {};
            newDates.forEach(date => {
                if (date) {
                    initialDailyOrders[date] = {};
                    lotteryTypesData.forEach(lt => {
                        const defQty = (defaultQuantitiesData && defaultQuantitiesData[lt.id]) ? Number(defaultQuantitiesData[lt.id]) : 0;
                        initialDailyOrders[date][lt.id] = defQty;
                    });
                }
            });

            // Overlay distribution totals
            const distTotalsRes = await fetch(`/api/distribution_totals?dates=${validDates.join(',')}`).then(r => r.ok ? r.json() : null);
            console.log('Distribution Totals Response:', distTotalsRes);
            if (distTotalsRes && distTotalsRes.dates) {
                validDates.forEach(date => {
                    const distForDate = distTotalsRes.dates[date];
                    if (!distForDate || !Array.isArray(distForDate.lottery_totals)) return;
                    distForDate.lottery_totals.forEach(lot => {
                        // Use computed distribution quantity per lottery
                        if (initialDailyOrders[date] && typeof lot.quantity === 'number') {
                            initialDailyOrders[date][lot.lottery_id] = lot.quantity;
                        }
                    });
                });
            }

            setDailyOrders(initialDailyOrders);
            setOriginalDailyOrders(JSON.parse(JSON.stringify(initialDailyOrders)));

            // Fetch ordering notes for these dates
            await fetchOrderingNotes(validDates);
        } catch (error) {
            console.error('Error building orders from distribution totals:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch ordering notes for the given dates
    const fetchOrderingNotes = async (dates) => {
        if (dates.length === 0) return;
        
        setNotesLoading(true);
        try {
            const fromDate = dates[0];
            const toDate = dates[dates.length - 1];
            const response = await fetch(`/api/ordering_notes?from=${fromDate}&to=${toDate}`);
            
            if (response.ok) {
                const notes = await response.json();
                // Filter for unread notes only
                const unreadNotes = notes.filter(note => !note.is_read);
                setOrderingNotes(unreadNotes);
            }
        } catch (error) {
            console.error('Error fetching ordering notes:', error);
        } finally {
            setNotesLoading(false);
        }
    };

    // Mark note as read
    const markNoteAsRead = async (noteId) => {
        try {
            const response = await fetch('/api/ordering_notes', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: noteId,
                    is_read: true
                }),
            });

            if (response.ok) {
                // Remove the note from the list since it's now read
                setOrderingNotes(prev => prev.filter(note => note.id !== noteId));
            } else {
                console.error('Failed to mark note as read');
            }
        } catch (error) {
            console.error('Error marking note as read:', error);
        }
    };

    // Get shop name by ID
    const getShopName = (shopId) => {
        const shop = shops.find(s => s.id === shopId);
        return shop ? shop.name : 'Unknown Shop';
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
        
        // Clear existing notes when dates change
        setOrderingNotes([]);
        
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
                    <>
                        {/* Ordering Notes Section */}
                        {(orderingNotes.length > 0 || notesLoading) && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                    Ordering Notes for Selected Dates
                                </h2>
                                {notesLoading ? (
                                    <div className="flex justify-center items-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {orderingNotes.map((note) => (
                                            <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                {getShopName(note.shop_id)}
                                                            </span>
                                                            <span className="text-gray-600 text-sm">
                                                                {new Date(note.note_date).toLocaleDateString('en-US', { 
                                                                    weekday: 'short', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-800 text-sm leading-relaxed break-words word-wrap overflow-wrap-anywhere">
                                                            {note.message}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-2">
                                                            Created: {new Date(note.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => markNoteAsRead(note.id)}
                                                        className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1 self-start sm:self-center"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span>Confirm</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Ordering Tables */}
                        <div className="flex flex-wrap -mx-2">
                            {renderTable('NLB')}
                            {renderTable('DLB')}
                        </div>
                    </>
                )}
            </div>
        </div>
        </div>
    );
}