import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Shield, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center mb-4 glow-primary">
            <img src={akshuLogo} alt="Akshu" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Akshu Portal</h1>
          <p className="text-muted-foreground mt-1">Secure Access Gateway</p>
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
              <span className="font-semibold">Access Key</span>
            </div>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your access key"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mono text-sm"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-destructive text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !key}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 glow-primary"
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
              Admin Access
            </button>
          </div>
        </motion.div>

        <p className="text-center text-muted-foreground/60 text-xs mt-6">
          Protected by Akshu Security Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
