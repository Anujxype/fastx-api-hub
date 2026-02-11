import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, FileText, Plus, Trash2, Copy, RefreshCw, LogOut, ShieldCheck,
  ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { getKeys, addKey, deleteKey, toggleKey, getLogs, type ApiKey, type SearchLog } from '@/lib/store';

const Admin = () => {
  const [tab, setTab] = useState<'keys' | 'logs'>('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [newName, setNewName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem('akshu_admin')) { navigate('/admin-login'); return; }
    refresh();
  }, [navigate]);

  const refresh = async () => {
    setLoading(true);
    const [k, l] = await Promise.all([getKeys(), getLogs()]);
    setKeys(k);
    setLogs(l);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    await addKey(newName.trim(), newKeyValue.trim() || undefined);
    setNewName('');
    setNewKeyValue('');
    await refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteKey(id);
    await refresh();
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    await toggleKey(id, currentEnabled);
    await refresh();
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('akshu_admin');
    navigate('/');
  };

  const generateRandom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let r = 'ak_';
    for (let i = 0; i < 24; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewKeyValue(r);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-accent" />
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-3">
          {[
            { id: 'keys' as const, label: 'Access Keys', icon: KeyRound },
            { id: 'logs' as const, label: 'Search Logs', icon: FileText },
          ].map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-accent text-accent-foreground glow-accent'
                  : 'glass hover:border-border'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'keys' && (
            <motion.div
              key="keys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Create New Key</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Key Name</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., User Alpha"
                      className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Key Value (auto-generated if empty)</label>
                    <div className="flex gap-2">
                      <input
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        placeholder="Auto-generated"
                        className="flex-1 px-4 py-3 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all mono text-sm"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateRandom}
                        className="px-3 py-3 rounded-xl glass hover:border-accent/50 transition-all"
                      >
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!newName.trim() || loading}
                  className="mt-4 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 glow-accent"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Key
                </motion.button>
              </div>

              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Active Keys ({keys.length})</h3>
                  </div>
                  <button
                    onClick={refresh}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {keys.map((k) => (
                      <motion.div
                        key={k.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`glass rounded-xl p-4 flex items-center justify-between gap-4 transition-all ${
                          !k.enabled ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{k.name}</p>
                          <p className="mono text-xs text-primary truncate">{k.key}</p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                            <span>Uses: {k.uses}</span>
                            <span className={k.enabled ? 'text-primary' : 'text-destructive'}>
                              {k.enabled ? '● Active' : '● Disabled'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggle(k.id, k.enabled)}
                            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                            title={k.enabled ? 'Disable' : 'Enable'}
                          >
                            {k.enabled ? (
                              <ToggleRight className="w-5 h-5 text-primary" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopy(k.key)}
                            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <Copy className={`w-4 h-4 ${copied === k.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(k.id)}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {keys.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8">No keys created yet</p>
                  )}
                  {loading && keys.length === 0 && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Search Logs ({logs.length})</h3>
                </div>
                <button onClick={refresh} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left py-3 px-2">User</th>
                      <th className="text-left py-3 px-2">Endpoint</th>
                      <th className="text-left py-3 px-2">Query</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-2 font-medium">{log.key_name}</td>
                        <td className="py-3 px-2 mono text-xs text-primary">{log.endpoint}</td>
                        <td className="py-3 px-2 mono text-xs truncate max-w-[200px]">{log.query}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'success' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">
                          {loading ? 'Loading...' : 'No logs yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Admin;
