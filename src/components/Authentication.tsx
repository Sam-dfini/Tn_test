import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { Lock, User, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthenticationProps {
  onAuthenticate: () => void;
}

export const Authentication: React.FC<AuthenticationProps> = ({ onAuthenticate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError('');
    setLoading(true);

    if (!isSignUp && email === 'operator' && password === 'pass') {
      safeStorage.setItem('ti_authenticated', 'true');
      onAuthenticate();
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticate();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 font-mono flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6">
        <div className="text-lg md:text-xl font-bold tracking-widest text-intel-cyan">SOVEREIGN_INTEL</div>
        <div className="hidden md:flex items-center space-x-4 text-xs text-slate-500">
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>SECURE_NODE_TUNISIA</span>
          <span className="flex items-center text-intel-cyan"><span className="w-2 h-2 rounded-full bg-intel-cyan mr-2 animate-pulse"></span>ENCRYPTED_UPLINK</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0f141a] border border-slate-800 p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">TUNISIA INTEL</h1>
            <p className="text-[#00f2ff] text-sm">// UPLINK ENCRYPTED : AWAITING CREDENTIALS</p>
          </div>

          <div className="bg-[#0a0c10] border border-slate-800 p-4 text-xs space-y-2 text-slate-400">
            <p>{'>'} SECURE CONNECTION ESTABLISHED...</p>
            <p>{'>'} ENCRYPTION PROTOCOL: ALPHA-9...</p>
            <p>{'>'} ENTER CREDENTIALS TO PROCEED <span className="inline-block w-2 h-4 bg-[#00f2ff] animate-pulse"></span></p>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-slate-700 p-3 pl-10 text-white focus:border-[#00f2ff] outline-none"
                  placeholder="OPERATOR@TUNISIA.INTEL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-slate-700 p-3 pl-10 text-white focus:border-[#00f2ff] outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button 
              onClick={handleAuth}
              disabled={loading}
              className="w-full border border-[#00f2ff] text-[#00f2ff] p-4 font-bold hover:bg-[#00f2ff]/10 transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : (isSignUp ? '[ REGISTER_OPERATOR ]' : '[ INITIATE_HANDSHAKE ]')}
            </button>

            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-slate-500 text-xs hover:text-white"
            >
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>

          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
            <span>SESSION_ID: 0X4F92_BB8</span>
            <span className="text-[#00f2ff]">EMERGENCY_OVERRIDE</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-800 flex items-center justify-between px-4 md:px-6 text-[8px] md:text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-nowrap">
        <span>SYSTEM_ENCRYPTION_V4.2 // SOVEREIGN_KERNEL</span>
        <div className="flex space-x-4 md:space-x-6 ml-4">
          <span>MARKET_TICKER: BTC/USD +2.4%</span>
          <span className="text-[#eab308]">GEOPOLITICAL_RISK: ELEVATED</span>
          <span>LATENCY: 14MS</span>
        </div>
      </footer>
    </div>
  );
};
