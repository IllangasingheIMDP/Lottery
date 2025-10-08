'use client';
import { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/navbar';
import { Suspense } from 'react';
function AddEditRecordContent() {
  const [step, setStep] = useState(1);
  const [recordId, setRecordId] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  //const searchParams = useSearchParams();
  const searchParams = useSearchParams();
  const visibleSteps = [1, 2, 6];

  const getNextStep = (currentStep) => {
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex !== -1 && currentIndex < visibleSteps.length - 1) {
      return visibleSteps[currentIndex + 1];
    }
    return currentStep;
  };

  const getPreviousStep = (currentStep) => {
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      return visibleSteps[currentIndex - 1];
    }
    return currentStep;
  };

  const shopId = searchParams.get('shopId');
  const date = searchParams.get('date');

  useEffect(() => {
    if (shopId && date) {
      setLoading(true);

      fetch(`/api/daily_records?shop_id=${shopId}&date=${date}`)
        .then((res) => res.json())
        .then((record) => {
          setRecordId(record.id);

          setData(record);

          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to load record');
          setLoading(false);
        });
    }
  }, [shopId, date]);

  const handleDelete = async (shopId, date) => {
    const confirmed = window.confirm('Are you sure you want to delete this record?');
    if (!confirmed) {
      // If user cancels, stop execution
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/daily_records/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopId,
          date: date

        }),
      });
      //console.log(res);
      if (res.status !== 200) throw new Error('Failed to Delete record');
      if (res.status === 200) {
        alert('Record deleted successfully')
        router.push('/lottery-records/?date=' + date);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = (e) => {
    e.preventDefault();
    router.push('/lottery-records?date=' + date);
  }
  const handleSubmit = async (stepData) => {
    setLoading(true);
    setError('');

    try {
      // For step 1, we need to initialize a new record
      if (step === 1 && !recordId) {
        const res = await fetch('/api/daily_records/initialise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop_id: shopId,
            date: date,
            data: stepData
          }),
        });

        if (!res.ok) throw new Error('Failed to initialize record');

        const result = await res.json();
        setRecordId(result.recordId);
      } else {
        // For subsequent steps or editing existing record
        const res = await fetch('/api/daily_records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: recordId,
            step,
            data: stepData
          }),
        });

        if (!res.ok) throw new Error('Failed to save step');
      }

  setData({ ...data, ...stepData });
  const nextStep = getNextStep(step);
  if (nextStep !== step) setStep(nextStep);
  else router.push('/lottery-records?date=' + date);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoFront = () => {
    const nextStep = getNextStep(step);
    if (nextStep !== step) setStep(nextStep);
  }

  const handleSubmitStep4 = async (stepData) => {
    setLoading(true);
    setError('');

    try {
      // For step 1, we need to initialize a new record
      if (step === 1 && !recordId) {
        const res = await fetch('/api/daily_records/initialise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop_id: shopId,
            date: date,
            data: stepData
          }),
        });

        if (!res.ok) throw new Error('Failed to initialize record');

        const result = await res.json();
        setRecordId(result.recordId);
      } else {
        // For subsequent steps or editing existing record
        const res = await fetch('/api/daily_records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: recordId,
            step,
            data: stepData
          }),
        });

        if (!res.ok) throw new Error('Failed to save step');
      }

      setData({ ...data, ...stepData });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const previousStep = getPreviousStep(step);
    if (previousStep !== step) setStep(previousStep);
  };
  const goBack = () => {
    if (step == 4) setStep(2);
  };


  const renderStep = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    switch (step) {
      case 1:
        return (
          <Step1
            initialData={{ price_per_lottery: data.price_per_lottery, lottery_quantity: data.lottery_quantity }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      case 2:
        return (
          <Step2
            initialData={{ cash_given: data.cash_given, got_tickets_total_price: data.got_tickets_total_price }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      case 3:
        return (
          <Step3
            initialData={{ nlb: data.nlb ? (typeof data.nlb === 'string' ? JSON.parse(data.nlb) : data.nlb) : {} }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      case 4:
        return (
          <Step4
            initialData={{ dlb: data.dlb ? (typeof data.dlb === 'string' ? JSON.parse(data.dlb) : data.dlb) : {} }}
            onSubmit={handleSubmitStep4}
            goFront={handleGoFront}
            loading={loading}
            goBack={goBack}
          />
        );
      case 5:
        return (
          <Step5
            initialData={{ faulty: data.faulty ? (typeof data.faulty === 'string' ? JSON.parse(data.faulty) : data.faulty) : {} }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      case 6:
        return (
          <Step6
            initialData={{ special_lotteries_note: data.special_lotteries_note || '' }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-50 py-8">
        <Header />
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4 flex flex-row justify-between sm:justify-between">
            <h1 className="text-xl font-bold text-white w-fit">
              {recordId ? 'Edit Record' : 'Add New Record'} - Step {step}
            </h1>
            <div className='w-fit h-fit flex flex-row justify-between'>
              <button
                onClick={handleGoBack}
                className="text-white bg-blue-600 px-2 rounded-4xl hover:text-gray-900 hover:cursor-pointer"
                aria-label="Go back"
              >
                <IoArrowBack size={24} />
              </button>
              <button onClick={(e) => { e.preventDefault(); handleDelete(shopId, date); }} className='bg-red-700 text-white px-2 py-1 rounded hover:cursor-pointer'>Delete</button>

            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                ></div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-700">
                {step}/6
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          {/* Form Steps */}
          <div className="px-6 pb-6">
            {loading && !renderStep() ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              renderStep()
            )}

            {/* Back Button - outside the form to avoid form submission */}
            {step > 1 && (
              <div className="mt-4">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

function Step6({ initialData, onSubmit, loading }) {
  const [specialNote, setSpecialNote] = useState(initialData.special_lotteries_note || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ special_lotteries_note: specialNote });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">විශේෂ ලොතරැයි සටහන</h2>

        <div>
          <label htmlFor="specialNote" className="block text-sm font-medium text-gray-700">
            ලොතරැයි පිළිබඳ විශේෂ සටහන් එකතු කරන්න.
          </label>
          <div className="mt-1">
            <textarea
              id="specialNote"
              rows={5}
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter any special notes here..."
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            විශේෂ ලොතරැයි පිළිබඳ වැදගත් තොරතුරු හෝ වෙනත් අදාළ විස්තර එක් කරන්න.
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                Processing...
              </>
            ) : (
              'Complete'
            )}
          </button>
        </div>
      </form>
    </Suspense>
  );
}

function Step1({ initialData, onSubmit, loading }) {
  const [price, setPrice] = useState(initialData.price_per_lottery || '');

  const [quantity, setQuantity] = useState(initialData.lottery_quantity || '');

  const totalWorth = price && quantity
    ? (parseFloat(price) * parseInt(quantity)).toFixed(2)
    : '0.00';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      price_per_lottery: parseFloat(price),
      lottery_quantity: parseInt(quantity)
    });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Lottery Details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              ලොතරැයි ටිකට් එකක මිල
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              ලොතරැයි ප්රමාණය
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">දී ඇති ටිකට්වල මුළු වටිනාකම:</span>
            <span className="text-lg font-bold text-indigo-600">${totalWorth}</span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                Processing...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>
    </Suspense>
  );
}

// Modify Step2 component
function Step2({ initialData, onSubmit, loading }) {
  const [cash, setCash] = useState(initialData.cash_given || '');
  const [totalPrice, setTotalPrice] = useState(initialData.got_tickets_total_price || '');
  const [loanBalance, setLoanBalance] = useState(0);
  const [loanAmount, setLoanAmount] = useState('');
  const [loadingLoan, setLoadingLoan] = useState(false);
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId');

  // Fetch loan balance when component mounts
  useEffect(() => {
    if (shopId) {
      fetch(`/api/loans?shop_id=${shopId}`)
        .then(res => res.json())
        .then(data => {
          setLoanBalance(data.unbalanced_amount || 0);
        })
        .catch(err => {
          console.error('Failed to fetch loan balance:', err);
        });
    }
  }, [shopId]);

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (!loanAmount || !shopId) return;

    setLoadingLoan(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shopId,
          amount: parseFloat(loanAmount),
          payment_date: searchParams.get('date') // Get the date from URL params
        }),
      });

      if (!res.ok) throw new Error('Failed to submit loan');

      alert('Loan submitted successfully');
      window.location.reload();
    } catch (error) {
      alert('Failed to submit loan: ' + error.message);
    } finally {
      setLoadingLoan(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      cash_given: parseFloat(cash),
      got_tickets_total_price: parseFloat(totalPrice)
    });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="space-y-6">
        {/* Loan Balance and Submission Section */}
        {/*<div className="bg-gray-50 p-4 rounded-md space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">ණය ශේෂය:</span>
            <span className="text-lg font-bold text-red-600">
              ${parseFloat(loanBalance).toFixed(2)}
            </span>
          </div>

          <form onSubmit={handleLoanSubmit} className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="loanAmount" className="sr-only">
                ණය මුදල
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="loanAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter loan amount"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingLoan}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loadingLoan ? 'Submitting...' : 'Submit Loan'}
            </button>
          </form>
        </div> */}

        {/* Existing Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">මුදල් සහ ටිකට්පත්</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="cash" className="block text-sm font-medium text-gray-700">
                මුදලින් ලැබුණු මුදල
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="cash"
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700">
                ටිකට්පත් මගින් ලැබුණු මුදල
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="totalPrice"
                  type="number"
                  min="0.00"
                  step="0.01"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                  Processing...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </form>
      </div>
    </Suspense>
  );
}

function Step3({ initialData, onSubmit, loading }) {
  const [nlb, setNlb] = useState(initialData.nlb || {});
  const [newPrice, setNewPrice] = useState('');
  const [newCount, setNewCount] = useState('');

  const handleAddNlb = () => {
    if (newPrice && newCount) {
      setNlb({ ...nlb, [newPrice]: parseInt(newCount) });
      setNewPrice('');
      setNewCount('');
    }
  };

  const handleRemoveNlb = (price) => {
    const updatedNlb = { ...nlb };
    delete updatedNlb[price];
    setNlb(updatedNlb);
  };

  const totalNlbPrice = Object.entries(nlb).reduce(
    (sum, [price, count]) => sum + parseFloat(price) * count,
    0
  ).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nlb });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">NLB Tickets</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700">
                මුදල්
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="newPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="col-span-4">
              <label htmlFor="newCount" className="block text-sm font-medium text-gray-700">
                ටිකට් ගණන
              </label>
              <input
                id="newCount"
                type="number"
                min="1"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div className="col-span-3 flex items-end">
              <button
                type="button"
                className="w-full mt-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleAddNlb}
              >
                Add
              </button>
            </div>
          </div>

          {Object.keys(nlb).length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Added Tickets:</h3>
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුදල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ටිකට් ගණන
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුළු මුදල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(nlb).map(([price, count]) => (
                      <tr key={price}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(parseFloat(price) * count).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleRemoveNlb(price)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">තවම NLB ටිකට්පත් එකතු කර නැත.</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">මුළු NLB මිල:</span>
            <span className="text-lg font-bold text-indigo-600">${totalNlbPrice}</span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                Processing...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>
    </Suspense>
  );
}


function Step4({ initialData, onSubmit, loading, goBack, goFront }) {
  const [dlb, setDlb] = useState(initialData.dlb || {});
  const [newPrice, setNewPrice] = useState('');
  const [newCount, setNewCount] = useState('');

  const handleAddDlb = () => {
    if (newPrice && newCount) {
      setDlb({ ...dlb, [newPrice]: parseInt(newCount) });
      setNewPrice('');
      setNewCount('');
    }
  };

  const handleRemoveDlb = (price) => {
    const updatedDlb = { ...dlb };
    delete updatedDlb[price];
    setDlb(updatedDlb);
  };

  const totalDlbPrice = Object.entries(dlb).reduce(
    (sum, [price, count]) => sum + parseFloat(price) * count,
    0
  ).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ dlb });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">DLB Tickets</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700">
                මුදල
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="newPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="col-span-4">
              <label htmlFor="newCount" className="block text-sm font-medium text-gray-700">
                ටිකට් ගණන
              </label>
              <input
                id="newCount"
                type="number"
                min="1"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div className="col-span-3 flex items-end">
              <button
                type="button"
                className="w-full mt-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleAddDlb}
              >
                Add
              </button>
            </div>
          </div>

          {Object.keys(dlb).length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Added Tickets:</h3>
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුදල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ටිකට් ගණන
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුළු මුදල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(dlb).map(([price, count]) => (
                      <tr key={price}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(parseFloat(price) * count).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleRemoveDlb(price)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">තවම DLB ටිකට්පත් එකතු කර නැත.</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">මුළු DLB මිල:</span>
            <span className="text-lg font-bold text-indigo-600">${totalDlbPrice}</span>
          </div>
        </div>

        <div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Step 2
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                  Processing...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              type="button"
              onClick={goFront}
              className="flex-1 text-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium  bg-teal-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          </div>
          <p className="text-md text-center text-gray-500 italic">Save before going to next step or go back</p>
        </div>
      </form>
    </Suspense>
  );
}
function Step5({ initialData, onSubmit, loading }) {
  const [faulty, setFaulty] = useState(initialData.faulty || {});
  const [newPrice, setNewPrice] = useState('');
  const [newCount, setNewCount] = useState('');

  const handleAddFaulty = () => {
    if (newPrice && newCount) {
      setFaulty({ ...faulty, [newPrice]: parseInt(newCount) });
      setNewPrice('');
      setNewCount('');
    }
  };

  const handleRemoveFaulty = (price) => {
    const updatedFaulty = { ...faulty };
    delete updatedFaulty[price];
    setFaulty(updatedFaulty);
  };

  const totalFaultyPrice = Object.entries(faulty).reduce(
    (sum, [price, count]) => sum + parseFloat(price) * count,
    0
  ).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ faulty });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">දෝෂ සහිත ප්රවේශපත්</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700">
                මුදල
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="newPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="col-span-4">
              <label htmlFor="newCount" className="block text-sm font-medium text-gray-700">
                ටිකට් ගණන
              </label>
              <input
                id="newCount"
                type="number"
                min="1"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div className="col-span-3 flex items-end">
              <button
                type="button"
                className="w-full mt-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleAddFaulty}
              >
                Add
              </button>
            </div>
          </div>

          {Object.keys(faulty).length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Added Faulty Tickets:</h3>
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුදල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ටිකට් ගණන
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        මුළු මිල
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(faulty).map(([price, count]) => (
                      <tr key={price}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(parseFloat(price) * count).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleRemoveFaulty(price)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">තවමත් දෝෂ සහිත ටිකට්පත් එකතු කර නොමැත.</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">දෝෂ සහිත ටිකට්පත්වල මුළු වටිනාකම:</span>
            <span className="text-lg font-bold text-indigo-600">${totalFaultyPrice}</span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] mr-2"></span>
                Processing...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>
    </Suspense>
  );
}

export default function AddEditRecord() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddEditRecordContent />
    </Suspense>
  );
}