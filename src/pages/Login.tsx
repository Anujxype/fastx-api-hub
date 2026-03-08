import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Shield, Loader2, Zap } from 'lucide-react';
import { validateAccessKey } from '@/lib/store';
import akshuLogo from '@/assets/akshu-logo.png';

const Login = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const found = await validateAccessKey(key);
    if (found) {
      sessionStorage.setItem('akshu_user', JSON.stringify(found));
      navigate('/portal');
    } else {
      setError('Invalid or disabled access key');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsla(165, 80%, 45%, 0.3), transparent 70%)', top: '10%', left: '15%' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, hsla(35, 90%, 55%, 0.25), transparent 70%)', bottom: '15%', right: '10%' }}
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="w-24 h-24 rounded-2xl border border-primary/30 flex items-center justify-center mb-5 glow-primary relative overflow-hidden"
            style={{ background: 'hsla(165, 80%, 45%, 0.08)' }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <img src={akshuLogo} alt="Akshu" className="w-14 h-14 object-contain relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-gradient">Akshu</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm font-medium tracking-wide uppercase">Secure Access Gateway</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-strong rounded-2xl p-8"
        >
          <form onSubmit={handleLogin}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Access Key</span>
            </div>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your access key"
              className="input-glass"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-destructive text-sm mt-2 flex items-center gap-1"
              >
                <span className="status-dot status-dot-inactive inline-block" />
                {error}
              </motion.p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !key}
              className="w-full mt-5 btn-primary"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              Access Portal
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/30 text-center">
            <button
              onClick={() => navigate('/admin-login')}
              className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
            >
              Admin Access →
            </button>
          </div>
        </motion.div>

        <p className="text-center text-muted-foreground/40 text-xs mt-6 tracking-wide">
          Protected by Akshu Security Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
