'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (role?: string | null) => {
    if (role === 'admin' || email.trim().toLowerCase() === 'admin@gmail.com') return router.push('/admin/dashboard');
    if (role === 'student' || email.includes('student')) return router.push('/student/dashboard');
    if (role === 'lecturer' || email.includes('lecturer')) return router.push('/lecturer/dashboard');
    router.push('/');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (email.trim().toLowerCase() === 'admin@gmail.com') {
        const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error ?? 'Admin login failed.');
        router.push('/admin/dashboard');
        return;
      }

      const signIn = () => supabaseClient.auth.signInWithPassword({ email, password });
      const { data, error: signInError } = await signIn();
      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          const confirmation = await fetch('/api/auth/confirm-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
          if (confirmation.ok) {
            const retry = await signIn();
            if (!retry.error) {
              redirectByRole((retry.data.user?.user_metadata?.role as string | undefined) ?? (retry.data.user?.app_metadata?.role as string | undefined) ?? null);
              return;
            }
          }
        }
        throw new Error(signInError.message);
      }
      redirectByRole((data.user?.user_metadata?.role as string | undefined) ?? (data.user?.app_metadata?.role as string | undefined) ?? null);
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#eef2ff] text-[#052978]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/login.jpg')" }} />
      <div className="absolute inset-0 bg-[#062b74]/25" />

      <header className="relative z-10 flex h-14 items-center border-b border-white/40 bg-white/90 px-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-5 w-5 fill-[#052978]" />Wayamba University Of Sri Lanka</div>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[340px] rounded-lg border border-slate-200/80 bg-white/95 p-5 shadow-2xl shadow-blue-950/25 backdrop-blur-sm sm:p-6">
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf2fc]"><GraduationCap className="h-5 w-5 fill-[#052978] text-[#052978]" /></span>
            <h1 className="mt-4 text-2xl font-extrabold text-[#09347f]">Sign In to PMS</h1>
            <p className="mt-1 text-sm text-slate-500">Access your academic project dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <div className="space-y-1.5"><Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label><Input id="email" type="email" placeholder="e.g. student@university.edu" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 border-slate-200 bg-[#fbfbff] text-sm text-slate-900" required /></div>
            <div className="space-y-1.5"><Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label><div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 border-slate-200 bg-[#fbfbff] pr-10 text-sm text-slate-900" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-2 h-11 w-full bg-[#052978] text-sm font-bold shadow-md shadow-blue-900/20 hover:bg-[#031f5a]">{loading ? 'Signing in...' : 'Login'}</Button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center"><p className="text-sm text-slate-500">New to the portal?</p><div className="mt-3 flex justify-center gap-3"><button onClick={() => router.push('/register/student')} className="text-sm font-bold text-[#09347f] hover:underline">Student sign up</button><span className="text-slate-300">|</span><button onClick={() => router.push('/register/lecturer')} className="text-sm font-bold text-[#09347f] hover:underline">Lecturer sign up</button></div></div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap justify-between gap-2 border-t border-white/40 bg-white/90 px-6 py-4 text-xs text-[#325183] backdrop-blur-sm"><span>Wayamba University of Sri Lanka</span><span>© 2026 Wayamba University of Sri Lanka. All rights reserved.</span></footer>
    </main>
  );
}
