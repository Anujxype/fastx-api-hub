import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, FileText, Plus, Trash2, Copy, RefreshCw, LogOut, ShieldCheck,
  ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { getKeys, addKey, deleteKey, toggleKey, getLogs, type ApiKey, type SearchLog } from '@/lib/store';

const KeyCard = ({ k, onToggle, onCopy, onDelete, copied }: {
  k: ApiKey; onToggle: () => void; onCopy: () => void; onDelete: () => void; copied: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className={`glass-card rounded-xl p-4 flex items-center justify-between gap-4 ${!k.enabled ? 'opacity-50' : ''}`}
  >
    <div className="flex-1 min-w-0">
      <p className="font-semibold">{k.name}</p>
      <p className="mono text-xs text-primary truncate">{k.key}</p>
      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
        <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
        <span>Uses: {k.uses}</span>
        <span className="flex items-center gap-1">
          <span className={`status-dot ${k.enabled ? 'status-dot-active' : 'status-dot-inactive'}`} />
          {k.enabled ? 'Active' : 'Disabled'}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onToggle}
        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors" title={k.enabled ? 'Disable' : 'Enable'}>
        {k.enabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onCopy}
        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
        <Copy className={`w-4 h-4 ${copied ? 'text-primary' : 'text-muted-foreground'}`} />
      </motion.button>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onDelete}
        className="p-2 rounded-lg hover:bg-destructive/20 transition-colors">
        <Trash2 className="w-4 h-4 text-destructive" />
      </motion.button>
    </div>
  </motion.div>
);

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
    setKeys(k); setLogs(l);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    await addKey(newName.trim(), newKeyValue.trim() || undefined);
    setNewName(''); setNewKeyValue('');
    await refresh();
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateRandom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let r = 'ak_';
    for (let i = 0; i < 24; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewKeyValue(r);
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-accent" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Akshu</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">Admin</span>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sessionStorage.removeItem('akshu_admin'); navigate('/'); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-secondary/50">
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3">
          {([
            { id: 'keys' as const, label: 'Access Keys', icon: KeyRound },
            { id: 'logs' as const, label: 'Search Logs', icon: FileText },
          ]).map((t) => (
            <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id ? 'btn-accent' : 'glass-card'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'keys' && (
            <motion.div key="keys" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Create Key */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Create New Key</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Key Name</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., User Alpha" className="input-glass" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Key Value (auto if empty)</label>
                    <div className="flex gap-2">
                      <input value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} placeholder="Auto-generated" className="flex-1 input-glass" />
                      <motion.button whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }} onClick={generateRandom}
                        className="px-3 py-3 rounded-xl glass-card transition-all">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate}
                  disabled={!newName.trim() || loading} className="mt-4 px-6 btn-accent">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Key
                </motion.button>
              </div>

              {/* Keys List */}
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Active Keys ({keys.length})</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refresh}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </motion.button>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {keys.map((k) => (
                      <KeyCard key={k.id} k={k}
                        onToggle={async () => { await toggleKey(k.id, k.enabled); await refresh(); }}
                        onCopy={() => handleCopy(k.key)}
                        onDelete={async () => { await deleteKey(k.id); await refresh(); }}
                        copied={copied === k.key}
                      />
                    ))}
                  </AnimatePresence>
                  {keys.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8">No keys created yet</p>
                  )}
                  {loading && keys.length === 0 && (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="glass-strong rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Search Logs ({logs.length})</h3>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refresh}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/50">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </motion.button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3">User</th>
                      <th className="text-left py-3 px-3">Endpoint</th>
                      <th className="text-left py-3 px-3">Query</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-3 font-medium">{log.key_name}</td>
                        <td className="py-3 px-3 mono text-xs text-primary">{log.endpoint}</td>
                        <td className="py-3 px-3 mono text-xs truncate max-w-[200px]">{log.query}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}>
                            <span className={`status-dot ${log.status === 'success' ? 'status-dot-active' : 'status-dot-inactive'}`} />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted-foreground py-8">{loading ? 'Loading...' : 'No logs yet'}</td></tr>
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
