'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/navbar';

// Utility to format date to YYYY-MM-DD
function formatDate(d) {
	if (typeof d === 'string') return d;
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function computeDayType(dateStr) {
	const d = new Date(dateStr + 'T00:00:00');
	const day = d.getUTCDay();
	if (day === 6) return 'SUNDAY';
	if (day === 5) return 'SATURDAY';
	return 'WEEKDAY';
}

export default function DailyDistributionsPage() {
	const [shops, setShops] = useState([]);
	const [selectedShop, setSelectedShop] = useState('');
	const [date, setDate] = useState(formatDate(new Date()));
	const [dataLoading, setDataLoading] = useState(false);
	const [rules, setRules] = useState([]); // effective rules
	const [mode, setMode] = useState('general'); // 'general' | 'date-specific' | 'general-edit'
	const [dayType, setDayType] = useState(computeDayType(formatDate(new Date())));
	const [editMode, setEditMode] = useState(false);
	const [editingQuantities, setEditingQuantities] = useState({});
	const [holidayOverride, setHolidayOverride] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	// General rules editing state
	const [editModeType, setEditModeType] = useState('date'); // 'date' | 'general'
	const [generalDayType, setGeneralDayType] = useState('WEEKDAY');

	// Fetch shops on mount
	useEffect(() => {
		const fetchShops = async () => {
			try {
				const res = await fetch('/api/shops');
				if (!res.ok) throw new Error('Failed to load shops');
				const data = await res.json();
				// Assume API returns an array of shops; filter active if property exists
				const active = Array.isArray(data) ? data.filter(s => s.active !== 0 && s.active !== false) : [];
				setShops(active);
				if (active.length > 0) setSelectedShop(String(active[0].id));
			} catch (e) {
				setError(e.message);
			}
		};
		fetchShops();
	}, []);

	// Fetch rules depending on editing mode and selections
	useEffect(() => {
		if (!selectedShop) return;
		const fetchRules = async () => {
			setDataLoading(true);
			setError(null);
			try {
				let url;
				if (editModeType === 'general') {
					url = `/api/daily_distributions?shop_id=${selectedShop}&day_type=${generalDayType}`;
				} else {
					url = `/api/daily_distributions?shop_id=${selectedShop}&date=${date}`;
				}
				const res = await fetch(url);
				if (!res.ok) throw new Error('Failed to load distribution rules');
				const data = await res.json();
				setMode(data.mode);
				setDayType(data.day_type);
				setRules(data.rules);
				setEditMode(false);
				setEditingQuantities({});
				setHolidayOverride(false);
			} catch (e) {
				setError(e.message);
			} finally {
				setDataLoading(false);
			}
		};
		fetchRules();
	}, [selectedShop, date, editModeType, generalDayType]);

	// Start editing
	const beginEdit = () => {
		const initial = {};
		rules.forEach(r => { initial[r.lottery_id] = r.quantity; });
		setEditingQuantities(initial);
		setEditMode(true);
		setSuccess(null);
	};

	const cancelEdit = () => {
		setEditMode(false);
		setEditingQuantities({});
		setHolidayOverride(false);
		setError(null);
	};

	const updateQuantity = (lotteryId, value) => {
		setEditingQuantities(q => ({ ...q, [lotteryId]: value === '' ? '' : Math.max(0, Number(value)) }));
	};

	const saveChanges = async () => {
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const ruleArray = Object.entries(editingQuantities).map(([lottery_id, quantity]) => ({ lottery_id: Number(lottery_id), quantity: Number(quantity || 0) }));
			let payload;
			if (editModeType === 'general') {
				// Save general rules (no date)
				payload = {
					shop_id: Number(selectedShop),
					date: null,
					day_type: generalDayType,
					rules: ruleArray
				};
			} else {
				const usedDayType = holidayOverride ? 'HOLIDAY' : computeDayType(date);
				payload = {
					shop_id: Number(selectedShop),
					date,
					day_type: usedDayType,
					rules: ruleArray
				};
			}
			const res = await fetch('/api/daily_distributions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({ error: 'Save failed' }));
				throw new Error(errData.error || 'Save failed');
			}
			setSuccess('Distribution rules saved');
			// Refetch depending on mode
			let refreshUrl;
			if (editModeType === 'general') {
				refreshUrl = `/api/daily_distributions?shop_id=${selectedShop}&day_type=${generalDayType}`;
			} else {
				refreshUrl = `/api/daily_distributions?shop_id=${selectedShop}&date=${date}`;
			}
			const refresh = await fetch(refreshUrl);
			if (refresh.ok) {
				const data = await refresh.json();
				setMode(data.mode);
				setDayType(data.day_type);
				setRules(data.rules);
			}
			setEditMode(false);
		} catch (e) {
			setError(e.message);
		} finally {
			setSaving(false);
		}
	};

	// Derived grouping & totals (use edited values if in editMode)
	const grouped = { NLB: [], DLB: [] };
	rules.forEach(r => {
		if (r.category === 'NLB') grouped.NLB.push(r); else if (r.category === 'DLB') grouped.DLB.push(r);
	});
	// Custom sort orders requested by client
	const NLB_ORDER = ['මහජන සම්පත','ගොවිසෙත','මෙගා පවර්','ධන නිධානය','හදහන','අද සම්පත','ජය','සුභ දවසක්'];
	const DLB_ORDER = ['ලග්න වාසනා','ශනිදා','සුපර්බෝල්','අද කෝටිපති','කප්රුක','සසිරි/ජයෝදා','ජය සම්පත','සුපිරි ධන සම්පත'];
	const NLB_INDEX = new Map(NLB_ORDER.map((n,i)=>[n,i]));
	const DLB_INDEX = new Map(DLB_ORDER.map((n,i)=>[n,i]));
	grouped.NLB.sort((a,b)=>{
		const ia = NLB_INDEX.has(a.name)?NLB_INDEX.get(a.name):1000;
		const ib = NLB_INDEX.has(b.name)?NLB_INDEX.get(b.name):1000;
		if (ia !== ib) return ia - ib;
		return a.name.localeCompare(b.name);
	});
	grouped.DLB.sort((a,b)=>{
		const ia = DLB_INDEX.has(a.name)?DLB_INDEX.get(a.name):1000;
		const ib = DLB_INDEX.has(b.name)?DLB_INDEX.get(b.name):1000;
		if (ia !== ib) return ia - ib;
		return a.name.localeCompare(b.name);
	});
	function displayQuantity(r) {
		return editMode ? Number(editingQuantities[r.lottery_id] ?? 0) : r.quantity;
	}
	const totalNLB = grouped.NLB.reduce((sum, r) => sum + displayQuantity(r), 0);
	const totalDLB = grouped.DLB.reduce((sum, r) => sum + displayQuantity(r), 0);
	const grandTotal = totalNLB + totalDLB;

	return (
		<div className="min-h-screen bg-[#0f111a]">
			<Header />
			<main className="max-w-7xl mx-auto p-4 sm:p-6">
			<div className="mb-6 rounded-3xl bg-gradient-to-r from-[#181c2b] via-[#23263a] to-[#181c2b] shadow-lg shadow-blue-900/40 border border-blue-900/30 p-6">
				<h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent tracking-tight mb-4">Daily Distributions</h1>
				<p className="text-sm text-blue-100/70 mb-4">Configure and override lottery distribution quantities per shop and date. If no date-specific rules exist, general weekday/weekend rules are applied automatically.</p>
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-xs font-semibold text-blue-200 mb-1">Shop</label>
						<select
							value={selectedShop}
							onChange={e => setSelectedShop(e.target.value)}
							className="w-full rounded-xl bg-[#23263a] border border-blue-800/50 text-blue-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
						>
							<option value="" disabled>Select shop</option>
							{shops.map(s => (
								<option key={s.id} value={s.id}>{s.name}</option>
							))}
						</select>
					</div>
					{editModeType === 'date' && (
						<div>
							<label className="block text-xs font-semibold text-blue-200 mb-1">Date</label>
							<input
								type="date"
								value={date}
								onChange={e => setDate(e.target.value)}
								className="w-full rounded-xl bg-[#23263a] border border-blue-800/50 text-blue-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
							/>
						</div>
					)}
					{editModeType === 'general' && (
						<div>
							<label className="block text-xs font-semibold text-blue-200 mb-1">General Day Type</label>
							<select
								value={generalDayType}
								onChange={e => setGeneralDayType(e.target.value)}
								className="w-full rounded-xl bg-[#23263a] border border-blue-800/50 text-blue-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
							>
								{['WEEKDAY','SATURDAY','SUNDAY','HOLIDAY'].map(t => <option key={t} value={t}>{t}</option>)}
							</select>
						</div>
					)}
					<div>
						<label className="block text-xs font-semibold text-blue-200 mb-1">Mode</label>
						<div className="flex gap-2">
							<button
								onClick={() => setEditModeType('date')}
								className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${editModeType==='date' ? 'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 text-white' : 'bg-[#23263a] text-blue-200 border border-blue-800/50'}`}
							>Per Date</button>
							
						</div>
					</div>
					<div className="flex flex-col justify-end">
						{!editMode && (
							<button
								disabled={!selectedShop || dataLoading}
								onClick={beginEdit}
								className="rounded-xl px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/30 disabled:opacity-40"
							>
								{editModeType === 'general' ? 'Edit General Quantities' : 'Edit Date Quantities'}
							</button>
						)}
						{editMode && (
							<div className="flex gap-2">
								<button
									onClick={saveChanges}
									disabled={saving}
									className="rounded-xl px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-900/30 disabled:opacity-40"
								>{saving ? 'Saving...' : 'Save'}</button>
								<button
									onClick={cancelEdit}
									disabled={saving}
									className="rounded-xl px-4 py-2 bg-[#23263a] border border-blue-800/50 text-blue-200 text-sm font-semibold hover:bg-blue-800/50"
								>Cancel</button>
							</div>
						)}
					</div>
				</div>
				{/* {editMode && editModeType === 'date' && (
					<label className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-100 mb-4">
						<input
							type="checkbox"
							checked={holidayOverride}
							onChange={e => setHolidayOverride(e.target.checked)}
							className="rounded text-cyan-500 focus:ring-cyan-400"
						/>
						<span>Mark this date as HOLIDAY (override day type)</span>
					</label>
				)} */}
				<div className="text-xs text-blue-300 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					{/* <span>Effective mode: <span className="font-bold">{mode === 'date-specific' ? 'DATE-SPECIFIC OVERRIDE' : (mode==='general-edit' ? 'GENERAL RULES EDIT' : 'GENERAL RULES')} ({holidayOverride ? 'HOLIDAY' : dayType})</span></span> */}
					<div className="flex flex-wrap gap-3 text-[11px]">
						<span className="px-2 py-1 rounded-lg bg-[#181c2b] border border-blue-800/40 text-blue-200">NLB Total: <span className="font-semibold text-cyan-300">{totalNLB}</span></span>
						<span className="px-2 py-1 rounded-lg bg-[#181c2b] border border-blue-800/40 text-blue-200">DLB Total: <span className="font-semibold text-cyan-300">{totalDLB}</span></span>
						<span className="px-2 py-1 rounded-lg bg-[#181c2b] border border-blue-800/40 text-blue-200">Grand Total: <span className="font-semibold text-cyan-300">{grandTotal}</span></span>
					</div>
				</div>
				{error && <div className="mb-3 rounded-xl bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-2 text-sm">{error}</div>}
				{success && <div className="mb-3 rounded-xl bg-green-900/40 border border-green-700/50 text-green-200 px-4 py-2 text-sm">{success}</div>}
				<div className="rounded-2xl bg-[#23263a] border border-blue-900/40 p-4">
					{dataLoading ? (
						<div className="text-blue-200 text-sm">Loading rules...</div>
					) : (
						<div>
							{/* Desktop grouped table */}
							<div className="hidden md:block">
								<table className="w-full text-sm">
									<thead>
										<tr className="text-blue-200 border-b border-blue-800/50">
											<th className="py-2 text-left font-semibold w-1/2">Lottery</th>
											<th className="py-2 text-left font-semibold w-1/4">Category</th>
											<th className="py-2 text-left font-semibold w-1/4">Quantity</th>
										</tr>
									</thead>
									<tbody>
										{/* NLB Section */}
										
										{grouped.NLB.map(r => (
											<tr key={r.lottery_id} className="border-b border-blue-800/30 last:border-none">
												<td className="py-2 text-blue-100 font-medium">{r.name}</td>
												<td className="py-2 text-blue-300">{r.category}</td>
												<td className="py-2">
													{editMode ? (
														<input
															type="number"
															min={0}
															value={editingQuantities[r.lottery_id] ?? 0}
															onChange={e => updateQuantity(r.lottery_id, e.target.value)}
															onWheel={e => e.currentTarget.blur()}
															className="w-24 rounded-lg bg-[#181c2b] border border-blue-800/50 text-blue-100 p-1 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
														/>
													) : (
														<span className="text-blue-100">{displayQuantity(r)}</span>
													)}
												</td>
											</tr>
										))}
										<tr className="bg-[#141827]">
											<td colSpan={3} className="py-2 px-2 text-cyan-300 font-semibold tracking-wide">NLB Lotteries (Total: {totalNLB})</td>
										</tr>
										<br></br>
										{/* DLB Section */}
										
										{grouped.DLB.map(r => (
											<tr key={r.lottery_id} className="border-b border-blue-800/30 last:border-none">
												<td className="py-2 text-blue-100 font-medium">{r.name}</td>
												<td className="py-2 text-blue-300">{r.category}</td>
												<td className="py-2">
													{editMode ? (
														<input
															type="number"
															min={0}
															value={editingQuantities[r.lottery_id] ?? 0}
															onChange={e => updateQuantity(r.lottery_id, e.target.value)}
															onWheel={e => e.currentTarget.blur()}
															className="w-24 rounded-lg bg-[#181c2b] border border-blue-800/50 text-blue-100 p-1 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
														/>
													) : (
														<span className="text-blue-100">{displayQuantity(r)}</span>
													)}
												</td>
											</tr>
										))}
										<tr className="bg-[#141827]">
											<td colSpan={3} className="py-2 px-2 text-cyan-300 font-semibold tracking-wide">DLB Lotteries (Total: {totalDLB})</td>
										</tr>
										<br></br>
										{/* Grand total row */}
										<tr className="bg-[#181c2b]">
											<td colSpan={2} className="py-2 px-2 text-blue-200 font-semibold">Grand Total</td>
											<td className="py-2 px-2 text-cyan-300 font-bold">{grandTotal}</td>
										</tr>
									</tbody>
								</table>
							</div>
							{/* Mobile grouped cards */}
							<div className="md:hidden space-y-5">
								<div>
									<div className="text-cyan-300 text-xs font-semibold mb-2">NLB Lotteries (Total: {totalNLB})</div>
									<div className="space-y-3">
										{grouped.NLB.map(r => (
											<div key={r.lottery_id} className="rounded-xl bg-[#181c2b] border border-blue-800/40 p-3 flex justify-between items-center">
												<div>
													<div className="text-blue-100 font-semibold text-sm">{r.name}</div>
													<div className="text-[11px] text-blue-300">Category: {r.category}</div>
												</div>
												<div>
													{editMode ? (
														<input
															type="number"
															min={0}
															value={editingQuantities[r.lottery_id] ?? 0}
															onChange={e => updateQuantity(r.lottery_id, e.target.value)}
															onWheel={e => e.currentTarget.blur()}
															className="w-20 rounded-lg bg-[#23263a] border border-blue-800/50 text-blue-100 p-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
														/>
													) : (
														<span className="text-blue-100 font-semibold">{displayQuantity(r)}</span>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
								<div>
									<div className="text-cyan-300 text-xs font-semibold mb-2">DLB Lotteries (Total: {totalDLB})</div>
									<div className="space-y-3">
										{grouped.DLB.map(r => (
											<div key={r.lottery_id} className="rounded-xl bg-[#181c2b] border border-blue-800/40 p-3 flex justify-between items-center">
												<div>
													<div className="text-blue-100 font-semibold text-sm">{r.name}</div>
													<div className="text-[11px] text-blue-300">Category: {r.category}</div>
												</div>
												<div>
													{editMode ? (
														<input
															type="number"
															min={0}
															value={editingQuantities[r.lottery_id] ?? 0}
															onChange={e => updateQuantity(r.lottery_id, e.target.value)}
															onWheel={e => e.currentTarget.blur()}
															className="w-20 rounded-lg bg-[#23263a] border border-blue-800/50 text-blue-100 p-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
														/>
													) : (
														<span className="text-blue-100 font-semibold">{displayQuantity(r)}</span>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="rounded-xl bg-[#141827] border border-blue-800/40 p-3 flex justify-between items-center">
									<div className="text-blue-200 text-xs font-semibold">Grand Total</div>
									<div className="text-cyan-300 font-bold">{grandTotal}</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			</main>
		</div>
	);
}

