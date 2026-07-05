import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Shield,
  MessageSquare,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';

export default function TeamHub() {
  const { authFetch, user } = useAuth();
  const { showNotification } = useNotification();

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskData, setTaskData] = useState({
    assignedTo: '',
    title: '',
    description: '',
    deadline: new Date().toISOString().substring(0, 10)
  });
  const [chatText, setChatText] = useState('');

  const chatEndRef = useRef(null);

  const fetchData = async () => {
    try {
      // 1. Fetch team members (Creator sees directory)
      const mRes = await authFetch('/team/members');
      const mData = await mRes.json();
      if (mData.success) setMembers(mData.members);

      // 2. Fetch Tasks
      const tRes = await authFetch('/team/tasks');
      const tData = await tRes.json();
      if (tData.success) setTasks(tData.tasks);

      // 3. Fetch Messages
      const cRes = await authFetch('/team/chat');
      const cData = await cRes.json();
      if (cData.success) {
        setMessages(cData.messages);
        setActiveChannelId(cData.activeChannelId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Poll chat messages every 4 seconds to simulate real-time sockets
  useEffect(() => {
    fetchData();

    const interval = setInterval(async () => {
      try {
        const cRes = await authFetch(`/team/chat?creatorId=${activeChannelId}`);
        const cData = await cRes.json();
        if (cData.success) {
          setMessages(cData.messages);
        }
      } catch (err) {
        // Silent refresh error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeChannelId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/team/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Task assigned successfully!', 'success');
        setShowTaskModal(false);
        setTaskData({
          assignedTo: '',
          title: '',
          description: '',
          deadline: new Date().toISOString().substring(0, 10)
        });
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (e) {
      showNotification('Assignment failed', 'error');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await authFetch(`/team/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Task status updated', 'success');
        fetchData();
      }
    } catch (e) {
      showNotification('Status change failed', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await authFetch(`/team/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Task deleted', 'success');
        fetchData();
      }
    } catch (e) {
      showNotification('Delete failed', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    try {
      const res = await authFetch('/team/chat', {
        method: 'POST',
        body: JSON.stringify({
          text: chatText,
          channelId: activeChannelId
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setChatText('');
      }
    } catch (e) {
      showNotification('Message failed to send', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-6 rounded-2xl border">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Team Hub Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">Assign projects, monitor due dates, and coordinate in real-time chat.</p>
        </div>
        {user.role === 'Creator' && (
          <button
            onClick={() => {
              if (members.length === 0) {
                showNotification('Please register a "Team Member" account in signup to assign tasks to them.', 'warning');
              }
              setShowTaskModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
          >
            <Plus className="w-4.5 h-4.5" /> Assign Task
          </button>
        )}
      </div>

      {/* Main Workspace Layout */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Task Board (3 cols wide) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Task list group */}
            <div className="glass p-6 rounded-2xl border">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6">Assigned Team Tasks</h3>

              {tasks.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  No tasks assigned in this workspace.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task._id || task.id}
                      className="p-5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="space-y-1.5 max-w-md">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {task.description || 'No script or reference notes logged.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Assigne: <span className="font-bold text-slate-600 dark:text-slate-400">{task.assignedToName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Deadline: <span className="font-bold">{task.deadline}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status select/actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task._id || task.id, e.target.value)}
                          className="px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        {user.role === 'Creator' && (
                          <button
                            onClick={() => handleDeleteTask(task._id || task.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulated Live Chat Client */}
            <div className="glass p-6 rounded-2xl border flex flex-col h-[400px]">
              <div className="flex items-center gap-2 pb-4 border-b dark:border-slate-800 mb-4">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Channel Team Room</h3>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1"></span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No conversation history. Post a message to initialize chat.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === (user._id || user.id);
                    return (
                      <div
                        key={msg._id || msg.id || i}
                        className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">{msg.senderName}</span>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-500 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border dark:border-slate-800/80'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type message here..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  className="flex-1 px-4 py-3 text-xs border rounded-xl bg-white dark:bg-slate-900 outline-none dark:border-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all shadow-md shadow-brand-500/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Team Members directory sidebar (1 col wide) */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border h-full">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 border-b dark:border-slate-800 pb-3 mb-4">
                Workspace Directory
              </h3>

              {members.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No Team Members registered.
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800/60"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">
                          {member.name}
                        </h4>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- TASK ASSIGN MODAL --- */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowTaskModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2 border-b dark:border-slate-800 pb-3">
                <CheckCircle className="w-5 h-5 text-brand-500" />
                Assign Team Task
              </h3>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Select Team Member</label>
                  <select
                    required
                    value={taskData.assignedTo}
                    onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose User --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rough Cut Editing - Vlog #12"
                    value={taskData.title}
                    onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={taskData.deadline}
                      onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Task Details & Notes</label>
                  <textarea
                    placeholder="Link raw files, outline editor cues, or sound design directions..."
                    rows={3}
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/10"
                >
                  Deploy Assigned Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
