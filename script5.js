const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/SuperAdmin.jsx', 'utf8');

// 1. Add State
code = code.replace(
  "const [sendingBroadcast, setSendingBroadcast] = useState(false);",
  "const [sendingBroadcast, setSendingBroadcast] = useState(false);\n  const [broadcastHistory, setBroadcastHistory] = useState([]);\n  const [loadingHistory, setLoadingHistory] = useState(false);"
);

// 2. Add fetch function
const fetchHistoryFn = `
  const fetchBroadcastHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await authFetch('/notifications/broadcasts');
      const data = await res.json();
      if (data.success) {
        setBroadcastHistory(data.broadcasts);
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'broadcast') {
      fetchBroadcastHistory();
    }
  }, [activeTab]);

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      const res = await authFetch(\`/notifications/broadcast/\${id}\`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('Broadcast deleted successfully', 'success');
        fetchBroadcastHistory();
      } else {
        showNotification(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      showNotification('Server error', 'error');
    }
  };

  const handleRemindBroadcast = async (id) => {
    if (!window.confirm('Send a reminder for this broadcast? This will bump it to the top.')) return;
    try {
      const res = await authFetch(\`/notifications/broadcast/\${id}/reminder\`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('Reminder sent successfully', 'success');
        fetchBroadcastHistory();
      } else {
        showNotification(data.message || 'Failed to send reminder', 'error');
      }
    } catch (err) {
      showNotification('Server error', 'error');
    }
  };
`;

code = code.replace(
  "const fetchAdminData = async () => {",
  fetchHistoryFn + "\n  const fetchAdminData = async () => {"
);

// 3. Update handleSendBroadcast to refresh history
code = code.replace(
  "setBroadcastMessage('');",
  "setBroadcastMessage('');\n        fetchBroadcastHistory();"
);

// 4. Update UI
const uiAddition = `
              <div className="mt-12 pt-8 border-t dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">Broadcast History</h3>
                  <button onClick={fetchBroadcastHistory} className="p-2 text-slate-400 hover:text-brand-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <RefreshCw className={\`w-5 h-5 \${loadingHistory ? 'animate-spin' : ''}\`} />
                  </button>
                </div>

                <div className="space-y-4">
                  {broadcastHistory.length === 0 && !loadingHistory ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed dark:border-slate-800">
                      No broadcast history found.
                    </div>
                  ) : (
                    broadcastHistory.map(b => (
                      <div key={b._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group hover:border-brand-500/30 transition-colors">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{b.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 max-w-xl">{b.message}</p>
                            <span className="text-[10px] font-medium text-slate-400 mt-2 block">
                              {new Date(b.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleRemindBroadcast(b._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            Remind
                          </button>
                          <button
                            onClick={() => handleDeleteBroadcast(b._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
`;

code = code.replace(
  "            </div>\n          )}\n\n          {/* --- TAB: PAYMENTS --- */}",
  "            </div>\n" + uiAddition + "          )}\n\n          {/* --- TAB: PAYMENTS --- */}"
);

// Add missing icon imports if needed
if (!code.includes('Bell')) {
  code = code.replace("Trash2,", "Trash2, Bell, RefreshCw,");
}

fs.writeFileSync('frontend/src/pages/SuperAdmin.jsx', code);
console.log('SuperAdmin updated');
