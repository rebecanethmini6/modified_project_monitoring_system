'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Sparkles, User, Lock, ArrowRight, BookOpen } from 'lucide-react';

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (role?: string | null) => {
    if (role === 'student') {
      router.push('/student/dashboard');
      return;
    }

    if (role === 'lecturer') {
      router.push('/lecturer/dashboard');
      return;
    }

    if (email.includes('student')) {
      router.push('/student/dashboard');
      return;
    }

    if (email.includes('lecturer')) {
      router.push('/lecturer/dashboard');
      return;
    }

    router.push('/');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const attemptLogin = () => supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error: signInError } = await attemptLogin();

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          const confirmResponse = await fetch('/api/auth/confirm-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (confirmResponse.ok) {
            const retry = await attemptLogin();
            if (!retry.error) {
              redirectByRole(retry.data.user?.user_metadata?.role ?? null);
              return;
            }
          }
        }

        setError(signInError.message);
        setLoading(false);
        return;
      }

      redirectByRole(data.user?.user_metadata?.role ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left side: Premium Academic Panel */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#4F46E5] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-wider text-white">UNIVERSITY PORTAL</h2>
            <p className="text-xs text-blue-200">Excellence in Research & Engineering</p>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-6 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
            <Sparkles className="w-4 h-4" />
            <span>Introducing Milestone Tracking</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Academic Project <br />
            <span className="text-emerald-400">Monitoring System</span>
          </h1>
          <p className="text-blue-100 leading-relaxed text-sm lg:text-base">
            Track and monitor final year research projects, collaborate with supervisors, submit milestones, and manage evaluations seamlessly.
          </p>
        </div>

        {/* Footer/Help Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Dashboard Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs lg:text-sm">
            <div>
              <span className="block text-blue-300 font-medium">Student account</span>
              <code className="text-white block mt-1 font-mono bg-black/20 p-1.5 rounded text-[11px] select-all">student@university.edu</code>
            </div>
            <div>
              <span className="block text-blue-300 font-medium">Lecturer account</span>
              <code className="text-white block mt-1 font-mono bg-black/20 p-1.5 rounded text-[11px] select-all">lecturer@university.edu</code>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Card Container */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo view */}
          <div className="flex flex-col items-center text-center md:hidden mb-6">
            <div className="bg-[#1E3A8A] p-3 rounded-2xl shadow-lg shadow-blue-900/10 mb-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Project Monitoring System</h1>
            <p className="text-sm text-gray-500">University Portal Login</p>
          </div>

          <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 text-center md:text-left">
                Sign In
              </CardTitle>
              <CardDescription className="text-center md:text-left text-gray-500">
                Enter your university credentials to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-55 border border-red-100 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-blue-900/10" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Log In <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">New to the portal?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 border-slate-200 text-gray-700 font-medium hover:bg-slate-55 rounded-xl text-xs sm:text-sm"
                    onClick={() => router.push('/register/student')}
                  >
                    Register as Student
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 border-slate-200 text-gray-700 font-medium hover:bg-slate-55 rounded-xl text-xs sm:text-sm"
                    onClick={() => router.push('/register/lecturer')}
                  >
                    Register as Lecturer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}