import { useState, useEffect, forwardRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, FileText, Plus, Trash2, Copy, RefreshCw, LogOut, ShieldCheck,
  ToggleLeft, ToggleRight, Loader2, Monitor, Smartphone, Tablet,
  MapPin, Globe, Activity, ChevronDown, CalendarClock, AlertTriangle, Clock,
  Shield, Bell, Heart, Wifi, WifiOff, Timer, ScrollText, X, PlusCircle,
  Megaphone, ToggleLeft as ToggleLeftIcon, ToggleRight as ToggleRightIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  getKeys, addKey, deleteKey, toggleKey, getLogs, disableExpiredKeys, updateKeyIps,
  getAuditLogs, checkEndpointHealth, ENDPOINTS,
  getBroadcasts, addBroadcast, toggleBroadcast, deleteBroadcast,
  type ApiKey, type SearchLog, type AuditLog, type Broadcast
} from '@/lib/store';

const DeviceIcon = ({ device }: { device: string | null }) => {
  if (device === 'Mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (device === 'Tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
};

const getExpiryStatus = (expiresAt: string | null) => {
  if (!expiresAt) return { label: 'No expiry', color: 'text-muted-foreground', urgent: false, expired: false };
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return { label: 'Expired', color: 'text-destructive', urgent: true, expired: true };
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 3) return { label: `Expires in ${days}d`, color: 'text-destructive', urgent: true, expired: false };
  if (days <= 7) return { label: `Expires in ${days}d`, color: 'text-yellow-500', urgent: true, expired: false };
  return { label: `Expires ${exp.toLocaleDateString()}`, color: 'text-muted-foreground', urgent: false, expired: false };
};

// IP Whitelist Editor inline
const IpWhitelistEditor = ({ apiKey, onSave }: { apiKey: ApiKey; onSave: (ips: string[]) => void }) => {
  const [ips, setIps] = useState<string[]>(apiKey.allowed_ips || []);
  const [newIp, setNewIp] = useState('');

  const addIp = () => {
    const trimmed = newIp.trim();
    if (!trimmed || ips.includes(trimmed)) return;
    // Basic IP validation
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed) && !/^[a-fA-F0-9:]+$/.test(trimmed)) {
      toast.error('Invalid IP address format');
      return;
    }
    setIps([...ips, trimmed]);
    setNewIp('');
  };

  const removeIp = (ip: string) => setIps(ips.filter(i => i !== ip));

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-3 rounded-xl border border-border/20 bg-secondary/10"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
        <Shield className="w-3 h-3" /> IP Whitelist
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {ips.length === 0 && <span className="text-xs text-muted-foreground">No restrictions — any IP allowed</span>}
        {ips.map(ip => (
          <span key={ip} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
            {ip}
            <button onClick={() => removeIp(ip)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newIp} onChange={e => setNewIp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addIp()}
          placeholder="e.g. 192.168.1.1" className="flex-1 input-glass text-xs" />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addIp}
          className="px-2 py-1 rounded-lg glass-card text-xs"><PlusCircle className="w-3.5 h-3.5" /></motion.button>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => onSave(ips)} className="mt-2 px-3 py-1 btn-accent text-xs">
        Save IP Rules
      </motion.button>
    </motion.div>
  );
};

const KeyCard = forwardRef<HTMLDivElement, {
  k: ApiKey; onToggle: () => void; onCopy: () => void; onDelete: () => void; onUpdateIps: (ips: string[]) => void; copied: boolean;
}>(({ k, onToggle, onCopy, onDelete, onUpdateIps, copied }, ref) => {
  const [showIps, setShowIps] = useState(false);
  const expiry = getExpiryStatus(k.expires_at);

  return (
    <motion.div
      ref={ref} layout
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={`glass-card rounded-xl p-4 ${!k.enabled || expiry.expired ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{k.name}</p>
          <p className="mono text-xs text-primary truncate">{k.key}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
            <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
            <span>Uses: {k.uses}</span>
            <span className="flex items-center gap-1">
              <span className={`status-dot ${k.enabled && !expiry.expired ? 'status-dot-active' : 'status-dot-inactive'}`} />
              {expiry.expired ? 'Expired' : k.enabled ? 'Active' : 'Disabled'}
            </span>
            <span className={`flex items-center gap-1 ${expiry.color}`}>
              {expiry.urgent ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {expiry.label}
            </span>
            <span className="flex items-center gap-1 text-accent">
              <Shield className="w-3 h-3" />
              {k.allowed_ips && k.allowed_ips.length > 0 ? `${k.allowed_ips.length} IP(s)` : 'Any IP'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowIps(!showIps)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors" title="IP Whitelist">
            <Shield className={`w-4 h-4 ${showIps ? 'text-accent' : 'text-muted-foreground'}`} />
          </motion.button>
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
      </div>
      <AnimatePresence>
        {showIps && <IpWhitelistEditor apiKey={k} onSave={onUpdateIps} />}
      </AnimatePresence>
    </motion.div>
  );
});
KeyCard.displayName = 'KeyCard';

const LogRow = ({ log }: { log: SearchLog }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-b border-border/10 hover:bg-secondary/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-3 font-medium">{log.key_name}</td>
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
            <DeviceIcon device={log.device} /><span>{log.browser || '—'}</span>
          </div>
        </td>
        <td className="py-3 px-3 text-muted-foreground text-xs">
          {log.location && log.location !== 'Unknown' ? (
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-accent" /><span className="truncate max-w-[120px]">{log.location}</span></div>
          ) : '—'}
        </td>
        <td className="py-3 px-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
        <td className="py-3 px-3">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <td colSpan={8} className="px-3 pb-3">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Device</p>
                  <div className="flex items-center gap-1.5 text-foreground"><DeviceIcon device={log.device} /><span>{log.device || 'Unknown'}</span></div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Browser & OS</p>
                  <p className="text-foreground">{log.browser || 'Unknown'} / {log.os || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">IP Address</p>
                  <div className="flex items-center gap-1.5 text-foreground"><Globe className="w-3 h-3 text-primary" /><span className="mono">{log.ip || 'Unknown'}</span></div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider font-medium mb-1">Location</p>
                  <div className="flex items-center gap-1.5 text-foreground"><MapPin className="w-3 h-3 text-accent" /><span>{log.location || 'Unknown'}</span></div>
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
  const [tab, setTab] = useState<'keys' | 'logs' | 'stats' | 'health' | 'audit' | 'broadcast'>('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newName, setNewName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newIps, setNewIps] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthResults, setHealthResults] = useState<Record<string, { status: 'up' | 'down' | 'slow'; latency: number }>>({});
  const [healthChecking, setHealthChecking] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; time: Date }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem('akshu_admin')) { navigate('/admin-login'); return; }
    refresh();
  }, [navigate]);

  // Real-time subscription for login notifications
  useEffect(() => {
    const channel = supabase
      .channel('admin-login-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'search_logs' }, (payload) => {
        const log = payload.new as SearchLog;
        const notif = {
          id: crypto.randomUUID(),
          message: `🔑 ${log.key_name} used ${log.endpoint} from ${log.location || 'Unknown'}`,
          time: new Date(),
        };
        setNotifications(prev => [notif, ...prev].slice(0, 20));
        toast.info(notif.message, { duration: 4000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Check expiring keys and show notifications
  useEffect(() => {
    if (keys.length === 0) return;
    const expiring = keys.filter(k => {
      if (!k.expires_at || !k.enabled) return false;
      const days = Math.ceil((new Date(k.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    });
    expiring.forEach(k => {
      const days = Math.ceil((new Date(k.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      toast.warning(`⚠️ Key "${k.name}" expires in ${days} day(s)`, { duration: 6000 });
    });
  }, [keys]);

  const refresh = async () => {
    setLoading(true);
    await disableExpiredKeys();
    const [k, l, a] = await Promise.all([getKeys(), getLogs(), getAuditLogs()]);
    setKeys(k); setLogs(l); setAuditLogs(a);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const ips = newIps.split(',').map(s => s.trim()).filter(Boolean);
    await addKey(newName.trim(), newKeyValue.trim() || undefined, newExpiry || null, ips);
    setNewName(''); setNewKeyValue(''); setNewExpiry(''); setNewIps('');
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

  const runHealthCheck = useCallback(async () => {
    setHealthChecking(true);
    const results: Record<string, { status: 'up' | 'down' | 'slow'; latency: number }> = {};
    // Check 3 at a time
    for (let i = 0; i < ENDPOINTS.length; i += 3) {
      const batch = ENDPOINTS.slice(i, i + 3);
      const batchResults = await Promise.all(batch.map(ep => checkEndpointHealth(ep.endpoint)));
      batch.forEach((ep, j) => { results[ep.endpoint] = batchResults[j]; });
      setHealthResults({ ...results });
    }
    setHealthChecking(false);
  }, []);

  const handleUpdateIps = async (id: string, ips: string[]) => {
    await updateKeyIps(id, ips);
    toast.success('IP whitelist updated');
    await refresh();
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
      <motion.header initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-accent" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Akshu</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <Bell className={`w-5 h-5 ${notifications.length > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
              {notifications.length > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[10px] flex items-center justify-center font-bold">
                  {Math.min(notifications.length, 9)}
                </motion.span>
              )}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sessionStorage.removeItem('akshu_admin'); navigate('/'); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-secondary/50">
              <LogOut className="w-4 h-4" /> Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'keys' as const, label: 'Keys', icon: KeyRound },
            { id: 'logs' as const, label: 'Logs', icon: FileText },
            { id: 'stats' as const, label: 'Analytics', icon: Activity },
            { id: 'health' as const, label: 'Health', icon: Heart },
            { id: 'audit' as const, label: 'Audit', icon: ScrollText },
          ]).map((t) => (
            <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setTab(t.id); if (t.id === 'health' && Object.keys(healthResults).length === 0) runHealthCheck(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
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
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">
                      <CalendarClock className="w-3.5 h-3.5 inline mr-1" />Valid Until (optional)
                    </label>
                    <input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)} className="input-glass" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">
                      <Shield className="w-3.5 h-3.5 inline mr-1" />Allowed IPs (comma-separated, optional)
                    </label>
                    <input value={newIps} onChange={(e) => setNewIps(e.target.value)}
                      placeholder="e.g. 192.168.1.1, 10.0.0.1" className="input-glass" />
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
                        onUpdateIps={(ips) => handleUpdateIps(k.id, ips)}
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Queries', value: logs.length, color: 'text-primary' },
                  { label: 'Success Rate', value: logs.length ? `${Math.round((successCount / logs.length) * 100)}%` : '0%', color: 'text-primary' },
                  { label: 'Unique Users', value: uniqueUsers, color: 'text-accent' },
                  { label: 'Locations', value: uniqueLocations, color: 'text-accent' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }} className="glass-strong rounded-xl p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent" /> Top Endpoints</h3>
                <div className="space-y-3">
                  {topEndpoints.map(([endpoint, count], i) => {
                    const pct = logs.length ? (count / logs.length) * 100 : 0;
                    return (
                      <motion.div key={endpoint} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }} className="flex items-center gap-4">
                        <span className="mono text-xs text-primary w-24 truncate">{endpoint}</span>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{count} hits</span>
                      </motion.div>
                    );
                  })}
                  {topEndpoints.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-bold mb-3">Success vs Errors</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>Success</span><span>{successCount}</span></div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: logs.length ? `${(successCount / logs.length) * 100}%` : '0%' }}
                          transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: 'hsl(var(--primary))' }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>Errors</span><span>{errorCount}</span></div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsla(220, 15%, 18%, 0.6)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: logs.length ? `${(errorCount / logs.length) * 100}%` : '0%' }}
                          transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: 'hsl(var(--destructive))' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-bold mb-3">Active Keys Overview</h3>
                  <div className="flex items-end gap-6 flex-wrap">
                    <div>
                      <p className="text-3xl font-extrabold text-primary">{keys.filter(k => k.enabled && !getExpiryStatus(k.expires_at).expired).length}</p>
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

          {/* HEALTH TAB */}
          {tab === 'health' && (
            <motion.div key="health" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">API Endpoint Health</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={runHealthCheck}
                    disabled={healthChecking}
                    className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg glass-card">
                    <RefreshCw className={`w-4 h-4 ${healthChecking ? 'animate-spin' : ''}`} />
                    {healthChecking ? 'Checking...' : 'Re-check'}
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ENDPOINTS.map((ep, i) => {
                    const result = healthResults[ep.endpoint];
                    return (
                      <motion.div key={ep.endpoint}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="glass-card rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{ep.name}</p>
                          <p className="mono text-xs text-muted-foreground">{ep.endpoint}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!result ? (
                            healthChecking ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Timer className="w-3 h-3" />{result.latency}ms
                              </span>
                              {result.status === 'up' && <Wifi className="w-4 h-4 text-primary" />}
                              {result.status === 'slow' && <Wifi className="w-4 h-4 text-yellow-500" />}
                              {result.status === 'down' && <WifiOff className="w-4 h-4 text-destructive" />}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {Object.keys(healthResults).length > 0 && (
                  <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-primary" /> Up</span>
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-yellow-500" /> Slow (&gt;3s)</span>
                    <span className="flex items-center gap-1"><WifiOff className="w-3 h-3 text-destructive" /> Down</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* AUDIT TAB */}
          {tab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Security Audit Log ({auditLogs.length})</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refresh}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </motion.button>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log, i) => {
                    const actionColors: Record<string, string> = {
                      KEY_CREATED: 'bg-primary/10 text-primary border-primary/20',
                      KEY_DELETED: 'bg-destructive/10 text-destructive border-destructive/20',
                      KEY_ENABLED: 'bg-primary/10 text-primary border-primary/20',
                      KEY_DISABLED: 'bg-destructive/10 text-destructive border-destructive/20',
                      IP_WHITELIST_UPDATED: 'bg-accent/10 text-accent border-accent/20',
                    };
                    return (
                      <motion.div key={log.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/10 transition-colors border-b border-border/10">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${actionColors[log.action] || 'bg-secondary/10 text-muted-foreground border-border/20'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-sm flex-1">{log.target}</span>
                        {log.details && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{log.details}</span>}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                      </motion.div>
                    );
                  })}
                  {auditLogs.length === 0 && <p className="text-center text-muted-foreground py-8">{loading ? 'Loading...' : 'No audit logs yet'}</p>}
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
