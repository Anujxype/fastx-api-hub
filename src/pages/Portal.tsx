import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LogOut, User, Loader2, Copy, Check, Zap, AlertTriangle, Shield,
  Smartphone, Fingerprint, Mail, Building2, Send, Landmark,
  CreditCard, Wallet, BadgeIndianRupee, Car, SearchCode, ClipboardList,
  Megaphone, X, Download, Sparkles,
  type LucideIcon
} from 'lucide-react';
import { ENDPOINTS, API_BASE, addLog, checkIpWhitelist, getActiveBroadcasts, type ApiKey, type Broadcast } from '@/lib/store';
import akshuLogo from '@/assets/akshu-logo.png';

const iconMap: Record<string, LucideIcon> = {
  Smartphone, Fingerprint, Mail, Building2, Send, Landmark,
  CreditCard, Wallet, BadgeIndianRupee, Car, SearchCode, ClipboardList,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const Portal = () => {
  const [user, setUser] = useState<ApiKey | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [expiryWarning, setExpiryWarning] = useState<string | null>(null);
  const [broadcastQueue, setBroadcastQueue] = useState<Broadcast[]>([]);
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('akshu_user');
    if (!stored) { navigate('/'); return; }
    const parsed = JSON.parse(stored) as ApiKey;
    setUser(parsed);

    // Check IP whitelist
    checkIpWhitelist(parsed).then(({ allowed, currentIp }) => {
      if (!allowed) {
        setIpBlocked(true);
        setResult(JSON.stringify({ error: 'Access denied', message: `Your IP (${currentIp}) is not whitelisted for this key.` }, null, 2));
      }
    });

    // Check expiry warning
    if (parsed.expires_at) {
      const days = Math.ceil((new Date(parsed.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 7 && days > 0) setExpiryWarning(`Your access key expires in ${days} day(s). Contact admin to renew.`);
      else if (days <= 0) setExpiryWarning('Your access key has expired. Contact admin.');
    }

    // Fetch active broadcasts and queue all unseen ones
    getActiveBroadcasts().then((bcs) => {
      const seenIds: string[] = JSON.parse(localStorage.getItem('akshu_seen_broadcasts') || '[]');
      const unseen = bcs.filter(b => !seenIds.includes(b.id));
      if (unseen.length > 0) {
        setBroadcastQueue(unseen.slice(1));
        setCurrentBroadcast(unseen[0]);
      }
    });
  }, [navigate]);

  const dismissBroadcast = () => {
    if (!currentBroadcast) return;
    // Mark as seen permanently
    const seen: string[] = JSON.parse(localStorage.getItem('akshu_seen_broadcasts') || '[]');
    localStorage.setItem('akshu_seen_broadcasts', JSON.stringify([...seen, currentBroadcast.id]));
    // Show next in queue or close
    if (broadcastQueue.length > 0) {
      setCurrentBroadcast(broadcastQueue[0]);
      setBroadcastQueue(prev => prev.slice(1));
    } else {
      setCurrentBroadcast(null);
    }
  };

  const ep = ENDPOINTS[selectedEndpoint];

  const handleSearch = async () => {
    if (!query.trim() || !ep || ipBlocked) return;
    setLoading(true);
    setResult(null);

    try {
      const url = `${API_BASE}${ep.endpoint}?${ep.param}=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      await addLog({ keyName: user?.name || 'Unknown', endpoint: ep.endpoint, query, status: 'success' });
    } catch (err) {
      setResult(JSON.stringify({ error: 'Request failed', details: String(err) }, null, 2));
      await addLog({ keyName: user?.name || 'Unknown', endpoint: ep.endpoint, query, status: 'error' });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akshu_${ep.endpoint.replace('/', '')}_${query}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('akshu_user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              background: i % 2 === 0 ? 'hsla(165, 80%, 45%, 0.15)' : 'hsla(35, 90%, 55%, 0.1)',
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong border-b border-border/30 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img
              src={akshuLogo} alt="Akshu" className="w-8 h-8 object-contain"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Akshu</h1>
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
              >
                Portal
              </motion.span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-primary"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-secondary/50"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        {/* Broadcast Popup */}
        <AnimatePresence>
          {currentBroadcast && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="glass-strong rounded-2xl p-6 max-w-md w-full border border-accent/30 shadow-2xl relative overflow-hidden"
              >
                {/* Decorative glow */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
                  style={{ background: 'radial-gradient(circle, hsla(35, 90%, 55%, 0.15), transparent 70%)' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <button
                  onClick={dismissBroadcast}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors z-10"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="relative z-10">
                  <motion.div
                    className="flex items-center gap-2 mb-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Megaphone className="w-5 h-5 text-accent" />
                    </motion.div>
                    <h3 className="font-bold text-lg">{currentBroadcast.title}</h3>
                  </motion.div>
                  <motion.p
                    className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentBroadcast.message}
                  </motion.p>
                  <p className="text-xs text-muted-foreground/50 mt-4">
                    {new Date(currentBroadcast.created_at).toLocaleString()}
                    {broadcastQueue.length > 0 && (
                      <span className="ml-2 text-accent">+{broadcastQueue.length} more</span>
                    )}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px hsla(35, 90%, 55%, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={dismissBroadcast}
                    className="mt-4 w-full btn-accent py-2.5 text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Got it
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warnings */}
        <AnimatePresence>
          {expiryWarning && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">{expiryWarning}</p>
            </motion.div>
          )}
          {ipBlocked && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <Shield className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">Your IP is not whitelisted for this key. API access is restricted.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Endpoint Grid */}
        <motion.section
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}>
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
            <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Select Endpoint</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ENDPOINTS.map((endpoint, i) => {
              const Icon = iconMap[endpoint.icon] || Search;
              const isActive = selectedEndpoint === i;
              return (
                <motion.button
                  key={endpoint.endpoint}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedEndpoint(i); setResult(null); setQuery(''); }}
                  className={`rounded-xl p-4 text-left transition-all relative overflow-hidden ${
                    isActive ? 'glass-card-active' : 'glass-card'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'radial-gradient(circle at 30% 30%, hsla(165,80%,45%,0.12), transparent 70%)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10"
                    animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <p className={`font-semibold text-sm mt-2 relative z-10 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {endpoint.name}
                  </p>
                  <p className="mono text-[10px] text-muted-foreground mt-0.5 truncate relative z-10">{endpoint.endpoint}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Search */}
        <motion.section
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              key={selectedEndpoint}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {(() => { const Icon = iconMap[ep.icon] || Search; return <Icon className="w-5 h-5 text-primary" />; })()}
            </motion.div>
            <motion.h3
              key={`title-${selectedEndpoint}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-lg"
            >
              {ep.name}
            </motion.h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Search by <span className="mono text-primary/80">{ep.param}</span>
          </p>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Enter ${ep.param}...`}
              className="flex-1 input-glass"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 btn-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <motion.div whileHover={{ rotate: 15 }}>
                  <Search className="w-4 h-4" />
                </motion.div>
              )}
              <span className="hidden sm:inline">Search</span>
            </motion.button>
          </div>
          <motion.p
            key={`hint-${selectedEndpoint}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mono text-xs text-primary/50 mt-3"
          >
            GET {ep.endpoint}?{ep.param}=&#123;value&#125;
          </motion.p>
        </motion.section>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="status-dot status-dot-active"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <h3 className="font-bold">Response</h3>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Copy className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </motion.button>
                </div>
              </div>
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl p-4 overflow-auto max-h-96 mono text-xs text-foreground/90 border border-border/20"
                style={{ background: 'hsla(220, 25%, 6%, 0.6)' }}
              >
                {result}
              </motion.pre>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Portal;
