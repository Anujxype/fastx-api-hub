import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, User, Loader2, Copy, Check, Zap } from 'lucide-react';
import { ENDPOINTS, API_BASE, addLog, type ApiKey } from '@/lib/store';
import akshuLogo from '@/assets/akshu-logo.png';

const Portal = () => {
  const [user, setUser] = useState<ApiKey | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('akshu_user');
    if (!stored) { navigate('/'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const ep = ENDPOINTS[selectedEndpoint];

  const handleSearch = async () => {
    if (!query.trim() || !ep) return;
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

  const handleLogout = () => {
    sessionStorage.removeItem('akshu_user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      {/* Header */}
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={akshuLogo} alt="Akshu" className="w-8 h-8 object-contain" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Akshu</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
            </div>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Endpoint Grid */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Select Endpoint</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ENDPOINTS.map((endpoint, i) => (
              <motion.button
                key={endpoint.endpoint}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedEndpoint(i); setResult(null); setQuery(''); }}
                className={`rounded-xl p-4 text-left transition-all ${
                  selectedEndpoint === i ? 'glass-card-active' : 'glass-card'
                }`}
              >
                <span className="text-xl">{endpoint.icon}</span>
                <p className={`font-semibold text-sm mt-1.5 ${selectedEndpoint === i ? 'text-primary' : 'text-foreground'}`}>
                  {endpoint.name}
                </p>
                <p className="mono text-[10px] text-muted-foreground mt-0.5 truncate">{endpoint.endpoint}</p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Search */}
        <motion.section layout className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{ep.name}</h3>
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Search</span>
            </motion.button>
          </div>
          <p className="mono text-xs text-primary/50 mt-3">
            GET {ep.endpoint}?{ep.param}=&#123;value&#125;
          </p>
        </motion.section>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-active" />
                  <h3 className="font-bold">Response</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
              </div>
              <pre className="rounded-xl p-4 overflow-auto max-h-96 mono text-xs text-foreground/90 border border-border/20" style={{ background: 'hsla(220, 25%, 6%, 0.6)' }}>
                {result}
              </pre>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Portal;
