'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StreamXAPI } from '@streamx/shared';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const loginState = useAuthStore((state) => state.loginState);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await StreamXAPI.login(email, password);
      if (data.success) {
        loginState(data.user, data.token);
        router.push('/');
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-20">
      <div className="glass-card w-full max-w-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted">Sign in to sync your playlists and history.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70 font-medium ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/70 font-medium ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amethyst transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-amethyst hover:bg-amethyst-light text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link href="/register" className="text-amethyst-light hover:text-white transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
