import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Edit2,
  Video,
  Instagram,
  Youtube,
  Send,
  Calendar as CalIcon,
  X
} from 'lucide-react';

export default function CalendarPage() {
  const { authFetch } = useAuth();
  const { showNotification } = useNotification();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    platform: 'YouTube',
    reminderMinutes: 30
  });

  const fetchEvents = async () => {
    try {
      const res = await authFetch('/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const daysArr = [];
  // Prev month filler days
  for (let x = firstDayIndex; x > 0; x--) {
    daysArr.push({
      day: prevLastDay - x + 1,
      isCurrentMonth: false,
      dateString: `${year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(prevLastDay - x + 1).padStart(2, '0')}`
    });
  }
  // Current month days
  for (let i = 1; i <= lastDay; i++) {
    daysArr.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }
  // Next month filler days (grid is 42 days total)
  const remainingCells = 42 - daysArr.length;
  for (let j = 1; j <= remainingCells; j++) {
    daysArr.push({
      day: j,
      isCurrentMonth: false,
      dateString: `${year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(j).padStart(2, '0')}`
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Add Event Form submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/calendar', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Content scheduled successfully!', 'success');
        setShowAddModal(false);
        fetchEvents();
        setFormData({
          title: '',
          description: '',
          start: '',
          platform: 'YouTube',
          reminderMinutes: 30
        });
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Failed to create event', 'error');
    }
  };

  // Edit/Update Submit
  const handleUpdateEvent = async (updatedFields) => {
    try {
      const res = await authFetch(`/calendar/${selectedEvent._id || selectedEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Schedule updated', 'success');
        setShowDetailModal(false);
        fetchEvents();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Update failed', 'error');
    }
  };

  // Delete
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this content schedule?')) return;
    try {
      const res = await authFetch(`/calendar/${eventId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Schedule deleted', 'success');
        setShowDetailModal(false);
        fetchEvents();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Delete failed', 'error');
    }
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setFormData(prev => ({ ...prev, start: dateStr }));
    setShowAddModal(true);
  };

  const getPlatformStyle = (platform) => {
    switch (platform) {
      case 'YouTube': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Instagram': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
      case 'TikTok': return 'bg-slate-900/10 text-slate-800 dark:text-slate-200 border-slate-900/20 dark:bg-slate-800/40 dark:border-slate-800';
      case 'Twitter': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default: return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Calendar Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-6 rounded-2xl border">
        <div className="flex items-center gap-4">
          <CalIcon className="w-6 h-6 text-brand-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-300"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().substring(0, 10));
              setFormData(prev => ({ ...prev, start: new Date().toISOString().substring(0, 10) }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10 ml-2"
          >
            <Plus className="w-4 h-4" /> Schedule Content
          </button>
        </div>
      </div>

      {/* Grid calendar */}
      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center my-4"><Logo animated={true} size={40} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-800 shadow-sm">
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-slate-50 dark:bg-slate-900/60 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b dark:border-slate-800">
              {d}
            </div>
          ))}

          {/* Day boxes */}
          {daysArr.map((cell, idx) => {
            // Find events for this date
            const dayEvents = events.filter(e => e.start === cell.dateString);
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(cell.dateString)}
                className={`min-h-[120px] p-2 bg-white dark:bg-[#111726] flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                  cell.isCurrentMonth ? '' : 'opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold p-1 rounded-md ${
                    cell.dateString === new Date().toISOString().substring(0, 10)
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {cell.day}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-500 transition-opacity">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Event badges */}
                <div className="flex-1 mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt._id || evt.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid day click trigger
                        setSelectedEvent(evt);
                        setShowDetailModal(true);
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded border truncate transition-all hover:scale-95 ${getPlatformStyle(evt.platform)}`}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD EVENT MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                <CalIcon className="w-5 h-5 text-brand-500" />
                Schedule Content Campaign
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 17 Setup Video"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={formData.start}
                      onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Platform Channel</label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    >
                      <option>YouTube</option>
                      <option>Instagram</option>
                      <option>TikTok</option>
                      <option>Twitter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Description & Reminders</label>
                  <textarea
                    placeholder="Write scripting hooks, thumbnail ideas, or sponsors details here..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Confirm Event Schedule
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EVENT DETAIL MODAL --- */}
      <AnimatePresence>
        {showDetailModal && selectedEvent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPlatformStyle(selectedEvent.platform)}`}>
                    {selectedEvent.platform}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Scheduled on: {selectedEvent.start}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">
                  {selectedEvent.title}
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedEvent.description || 'No script ideas/notes logged for this event.'}
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t dark:border-slate-800">
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent._id || selectedEvent.id)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Event
                  </button>

                  <button
                    onClick={() => {
                      const newTitle = prompt('Edit Event Title:', selectedEvent.title);
                      if (newTitle) {
                        handleUpdateEvent({ title: newTitle });
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Title
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
