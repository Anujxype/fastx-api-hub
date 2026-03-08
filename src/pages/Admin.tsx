import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, FileText, Plus, Trash2, Copy, RefreshCw, LogOut, ShieldCheck,
  ToggleLeft, ToggleRight, Loader2, Monitor, Smartphone, Tablet,
  MapPin, Globe, Activity, ChevronDown, ChevronUp
} from 'lucide-react';
import { getKeys, addKey, deleteKey, toggleKey, getLogs, type ApiKey, type SearchLog } from '@/lib/store';

const DeviceIcon = ({ device }: { device: string | null }) => {
  if (device === 'Mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (device === 'Tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
};

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

const LogRow = ({ log }: { log: SearchLog }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-b border-border/10 hover:bg-secondary/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-3 font-medium">
          <div className="flex items-center gap-2">
            {log.key_name}
          </div>
        </td>
        <td className="py-3 px-3 mono text-xs text-primary">{log.endpoint}</td>
        <td className="py-3 px-3 mono text-xs truncate max-w-[150px]">{log.query}</td>
        <td className="py-3 px-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            log.status === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            <span className={`status-dot ${log.status === 'success' ? 'status-dot-active' : 'status-dot-inactive'}`} />
            {log.status}
          </span>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <DeviceIcon device={log.device} />
            <span>{log.browser || '—'}</span>
          </div>
        </td>
        <td className="py-3 px-3 text-muted-foreground text-xs">
          {log.location && log.location !== 'Unknown' ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-accent" />
              <span className="truncate max-w-[120px]">{log.location}</span>
            </div>
          ) : '—'}
        </td>
        <td className="py-3 px-3 text-muted-foreground text-xs whitespace-nowrap">
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td className="py-3 px-3">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={8} className="px-3 pb-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
              >
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Device</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <DeviceIcon device={log.device} />
                    <span>{log.device || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Browser & OS</p>
                  <p className="text-foreground">{log.browser || 'Unknown'} / {log.os || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">IP Address</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Globe className="w-3 h-3 text-primary" />
                    <span className="mono">{log.ip || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Location</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-3 h-3 text-accent" />
                    <span>{log.location || 'Unknown'}</span>
                  </div>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const Admin = () => {
  const [tab, setTab] = useState<'keys' | 'logs' | 'stats'>('keys');
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

  // Stats
  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const uniqueUsers = new Set(logs.map(l => l.key_name)).size;
  const uniqueLocations = new Set(logs.map(l => l.location).filter(Boolean)).size;
  const topEndpoints = Object.entries(
    logs.reduce((acc, l) => { acc[l.endpoint] = (acc[l.endpoint] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      <motion.header
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-b border-border/30 sticky top-0 z-50"
      >
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
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 flex-wrap">
          {([
            { id: 'keys' as const, label: 'Access Keys', icon: KeyRound },
            { id: 'logs' as const, label: 'Search Logs', icon: FileText },
            { id: 'stats' as const, label: 'Analytics', icon: Activity },
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
          {/* KEYS TAB */}
          {tab === 'keys' && (
            <motion.div key="keys" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
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
                  {keys.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No keys created yet</p>}
                  {loading && keys.length === 0 && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* LOGS TAB */}
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
              <p className="text-muted-foreground text-xs mb-4">Click a row to expand device & location details</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-3">User</th>
                      <th className="text-left py-3 px-3">Endpoint</th>
                      <th className="text-left py-3 px-3">Query</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Device</th>
                      <th className="text-left py-3 px-3">Location</th>
                      <th className="text-left py-3 px-3">Time</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => <LogRow key={log.id} log={log} />)}
                    {logs.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-muted-foreground py-8">{loading ? 'Loading...' : 'No logs yet'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* STATS TAB */}
          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Queries', value: logs.length, color: 'text-primary' },
                  { label: 'Success Rate', value: logs.length ? `${Math.round((successCount / logs.length) * 100)}%` : '0%', color: 'text-primary' },
                  { label: 'Unique Users', value: uniqueUsers, color: 'text-accent' },
                  { label: 'Locations', value: uniqueLocations, color: 'text-accent' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-strong rounded-xl p-5"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Top Endpoints */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" /> Top Endpoints
                </h3>
                <div className="space-y-3">
                  {topEndpoints.map(([endpoint, count], i) => {
                    const pct = logs.length ? (count / logs.length) * 100 : 0;
                    return (
                      <motion.div
                        key={endpoint}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4"
                      >
                        <span className="mono text-xs text-primary w-24 truncate">{endpoint}</span>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{count} hits</span>
                      </motion.div>
                    );
                  })}
                  {topEndpoints.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>}
                </div>
              </div>

              {/* Error Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-bold mb-3">Success vs Errors</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Success</span><span>{successCount}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: logs.length ? `${(successCount / logs.length) * 100}%` : '0%' }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full" style={{ background: 'hsl(var(--primary))' }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Errors</span><span>{errorCount}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: logs.length ? `${(errorCount / logs.length) * 100}%` : '0%' }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full" style={{ background: 'hsl(var(--destructive))' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-bold mb-3">Active Keys Overview</h3>
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-3xl font-extrabold text-primary">{keys.filter(k => k.enabled).length}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-destructive">{keys.filter(k => !k.enabled).length}</p>
                      <p className="text-xs text-muted-foreground">Disabled</p>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-accent">{keys.reduce((sum, k) => sum + (k.uses || 0), 0)}</p>
                      <p className="text-xs text-muted-foreground">Total Uses</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Admin;
