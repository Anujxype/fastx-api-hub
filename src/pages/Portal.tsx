import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, User, Loader2, Copy, Check } from 'lucide-react';
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
    <div className="min-h-screen gradient-bg">
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={akshuLogo} alt="Akshu" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-bold">Akshu Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-muted-foreground text-sm font-medium mb-3">Select Endpoint</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ENDPOINTS.map((ep, i) => (
              <motion.button
                key={ep.endpoint}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedEndpoint(i); setResult(null); setQuery(''); }}
                className={`glass rounded-xl p-4 text-left transition-all ${
                  selectedEndpoint === i
                    ? 'border-primary/60 glow-primary text-primary'
                    : 'hover:border-border'
                }`}
              >
                <span className="text-lg">{ep.icon}</span>
                <p className={`font-semibold text-sm mt-1 ${selectedEndpoint === i ? 'text-primary' : ''}`}>
                  {ep.name}
                </p>
                <p className="mono text-xs text-muted-foreground mt-0.5">{ep.endpoint}</p>
              </motion.button>
            ))}
          </div>
        </section>

        <motion.section layout className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{ep.name}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Get details by {ep.param}</p>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Enter ${ep.param}`}
              className="flex-1 px-4 py-3 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mono text-sm"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 glow-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </motion.button>
          </div>
          <p className="mono text-xs text-primary/70 mt-3">
            GET {ep.endpoint}?{ep.param}=&#123;value&#125;
          </p>
        </motion.section>

        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Response</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-background/60 rounded-xl p-4 overflow-auto max-h-96 mono text-xs text-foreground/90 border border-border/30">
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
