import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { validateAdmin } from '@/lib/store';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    
    if (validateAdmin(password)) {
      sessionStorage.setItem('akshu_admin', 'true');
      navigate('/admin');
    } else {
      setError('Invalid admin password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        className="absolute w-64 h-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, hsla(35, 90%, 55%, 0.3), transparent 70%)', top: '20%', right: '20%' }}
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </motion.button>

        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-2xl border border-accent/30 flex items-center justify-center mb-5 glow-accent"
            style={{ background: 'hsla(35, 90%, 55%, 0.08)' }}
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <ShieldCheck className="w-12 h-12 text-accent" />
          </motion.div>
          <h1 className="text-4xl font-extrabold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-wide uppercase">Restricted Access</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-strong rounded-2xl p-8"
        >
          <form onSubmit={handleLogin}>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-accent" />
              <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Admin Password</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-glass"
            />
            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-sm mt-2 flex items-center gap-1">
                <span className="status-dot status-dot-inactive inline-block" />
                {error}
              </motion.p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !password}
              className="w-full mt-5 btn-accent"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Access Admin Panel
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-muted-foreground/40 text-xs mt-6 tracking-wide">
          Administrative access is logged and monitored
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
