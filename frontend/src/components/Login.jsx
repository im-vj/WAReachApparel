import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ShieldCheck,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide both work email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('wareach_token', token);
      localStorage.setItem('wareach_user', JSON.stringify(user));

      toast.success(`Authenticated as ${user.name || user.email}`);
      onLoginSuccess(user);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Authentication rejected. Verify credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0b10] text-zinc-100 flex font-sans selection:bg-emerald-500/25 selection:text-emerald-300 antialiased overflow-x-hidden">
      
      {/* Left Column - Brand Showcase & Live Campaign Visuals (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06] overflow-hidden bg-[#07080c]">
        {/* Subtle Grid & Noise Texture Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <MessageSquare className="w-5 h-5 text-zinc-950 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">WAReach <span className="text-xs font-mono font-normal uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/[0.08] ml-1">Enterprise</span></span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Graph v25.0 API
          </div>
        </div>

        {/* Center Content & Animated Mockup */}
        <div className="relative z-10 my-auto max-w-xl py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
              Precision messaging at enterprise throughput.
            </h1>
            <p className="mt-4 text-base xl:text-lg text-zinc-400 font-normal leading-relaxed max-w-lg">
              Official Meta Cloud API architecture engineered specifically for high-conversion apparel retail engagement.
            </p>
          </motion.div>

          {/* Floating Live Telemetry Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-2 gap-4"
          >
            {/* Telemetry Card 1 */}
            <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.15] transition-colors duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider">Delivery Latency</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">142ms</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>99.94% Success Rate</span>
              </div>
            </div>

            {/* Telemetry Card 2 */}
            <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.15] transition-colors duration-300">
              <div className="flex items-center justify-between text-zinc-400 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider">Verified Identity</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">AES-256</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </motion.div>

          {/* Simulated WhatsApp Notification Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-zinc-900/60 border border-emerald-500/20 backdrop-blur-md flex items-center gap-4"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0 ml-1"></div>
            <div className="text-xs text-zinc-300 leading-normal font-sans">
              <span className="text-white font-semibold block mb-0.5">Automated Dispatch Engine Operational</span>
              Worker queue processing template sync and contact routing with zero drops.
            </div>
          </motion.div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/[0.06] text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Global Datacenter Routing</span>
          </div>
          <div>WAReach Apparel LLC • © 2026</div>
        </div>
      </div>

      {/* Right Column - Minimalist Staff-Level Login Portal */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-[#0a0b10] relative">
        {/* Ambient mobile top glow */}
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-emerald-500/10 blur-[80px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] mx-auto"
        >
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5 text-zinc-950 fill-current" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">WAReach</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Sign in
            </h2>
            <p className="text-sm text-zinc-400 font-normal">
              Access your apparel enterprise messaging console
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Work Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 block">
                Work Email
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="username"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-emerald-500/80 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast('Please contact your IT administrator to reset enterprise credentials.', { icon: '🔒' })}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-emerald-500/80 rounded-xl pl-10 pr-11 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 px-4 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_16px_rgba(16,185,129,0.25)] hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_6px_20px_rgba(16,185,129,0.35)] active:scale-[0.985] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none group"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-12 pt-6 border-t border-white/[0.06] flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
            <span>Protected by WAReach Enterprise Zero-Trust Auth</span>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
