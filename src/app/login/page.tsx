"use client";

import Link from 'next/link';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Bypass actual auth, just route to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="absolute inset-0 z-[-1] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f2fe]/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl animate-in flip-in-y duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-outfit font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Log in to your Digital Twin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all flex items-center justify-center gap-2 group"
          >
            Sign In
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10"></div>
          <span className="text-xs text-gray-500 uppercase">or continue with</span>
          <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <button className="mt-6 w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span>Github</span>
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#00f2fe] hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
