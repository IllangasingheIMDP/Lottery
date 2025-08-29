'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/navbar';

export default function OrderingNotesPage() {
  const [shops, setShops] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    shop_id: '',
    note_date: new Date().toISOString().split('T')[0], // Today's date
    message: ''
  });

  // Fetch shops on component mount
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/shops');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch shops');
        }
        const data = await res.json();
        setShops(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [router]);

  // Fetch recent notes
  const fetchNotes = async () => {
    try {
      setNotesLoading(true);
      const res = await fetch('/api/ordering_notes?limit=10');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.shop_id || !formData.note_date || !formData.message.trim()) {
        throw new Error('Please fill in all fields');
      }

      const res = await fetch('/api/ordering_notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create note');
      }

      setSuccess('Note created successfully!');
      setFormData({
        shop_id: '',
        note_date: new Date().toISOString().split('T')[0],
        message: ''
      });
      
      // Refresh notes list
      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`/api/ordering_notes?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete note');
      }

      setSuccess('Note deleted successfully!');
      fetchNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAsRead = async (id, currentReadStatus) => {
    try {
      const res = await fetch('/api/ordering_notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          is_read: !currentReadStatus
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update note status');
      }

      setSuccess(`Note marked as ${!currentReadStatus ? 'read' : 'unread'} successfully!`);
      fetchNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter notes based on read status
  const filteredNotes = notes.filter(note => {
    if (filter === 'unread') return !note.is_read;
    if (filter === 'read') return note.is_read;
    return true; // 'all'
  });

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black bg-cover bg-top bg-no-repeat">
        <Header />
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-cover bg-top bg-no-repeat">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Ordering Notes</h1>
          <p className="text-blue-100/70">Add and manage ordering notes for your shops</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 backdrop-blur-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 backdrop-blur-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add New Note Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">Add New Ordering Note</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Selection */}
              <div>
                <label htmlFor="shop_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Select Shop *
                </label>
                <select
                  id="shop_id"
                  name="shop_id"
                  value={formData.shop_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
                >
                  <option value="" disabled className="bg-gray-800 text-gray-300">
                    Choose a shop...
                  </option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id} className="bg-gray-800 text-gray-200">
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="note_date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="note_date"
                  name="note_date"
                  value={formData.note_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Enter your ordering note message here..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Adding Note...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Notes */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-200">Recent Notes</h2>
              <div className="flex items-center space-x-4">
                {/* Filter buttons */}
                <div className="flex bg-white/5 rounded-lg p-1">
                  {[
                    { key: 'all', label: 'All', count: notes.length },
                    { key: 'unread', label: 'Unread', count: notes.filter(n => !n.is_read).length },
                    { key: 'read', label: 'Read', count: notes.filter(n => n.is_read).length }
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        filter === key
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
                {/* Refresh button */}
                <button
                  onClick={fetchNotes}
                  disabled={notesLoading}
                  className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className={`h-5 w-5 ${notesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {notesLoading ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-300">No notes found</h3>
                <p className="mt-1 text-sm text-gray-400">Get started by creating a new ordering note.</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-300">No {filter} notes found</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {filter === 'unread' ? 'All notes have been read.' : 
                   filter === 'read' ? 'No notes have been read yet.' : 
                   'Get started by creating a new ordering note.'}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className={`p-6 hover:bg-white/5 transition-colors ${note.is_read ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                          {getShopName(note.shop_id)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(note.note_date).toLocaleDateString()}
                        </span>
                        {/* Read status indicator */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          note.is_read 
                            ? 'bg-green-600/20 text-green-300' 
                            : 'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {note.is_read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed break-words">
                        {note.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        Created: {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      {/* Mark as read/unread button */}
                      <button
                        onClick={() => markAsRead(note.id, note.is_read)}
                        className={`p-2 rounded-lg transition-colors ${
                          note.is_read
                            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                        }`}
                        title={note.is_read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {note.is_read ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete note"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
