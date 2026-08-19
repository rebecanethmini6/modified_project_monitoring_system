'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, GraduationCap, BookOpen, Users, BarChart3, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/20 bg-white/70 px-6 backdrop-blur-md shadow-sm transition-all md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800 hidden sm:block">
            Project Monitor
          </span>
        </div>
        <div className="flex items-center gap-4">


        </div>
      </nav>

      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/cover.jpg')" }} />
          <div className="absolute inset-0 bg-blue-950/40" />
          {/* Subtle blue inner shadow/vignette effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 via-transparent to-blue-900/30" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center mt-10">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400"></span>
            </span>
            Wayamba University of Sri Lanka
          </div>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl md:text-7xl">
            Streamline Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">Academic Projects</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-100 drop-shadow-sm sm:text-xl">
            A centralized, intelligent platform for monitoring final year projects, research initiatives, and collaborative academic ventures with real-time precision.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button onClick={() => router.push('/login')} className="group h-14 w-full rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40 sm:w-auto">
              Access Dashboard
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">Integrated Academic Ecosystem</h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Everything you need to manage, track, and evaluate university projects from inception to completion.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
              <div className={`mb-6 inline-flex rounded-2xl p-4 ${feature.color} transition-transform group-hover:scale-110`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-center">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Project Monitor</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Wayamba University of Sri Lanka. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description: 'Monitor student progress, upcoming milestones, and submission deadlines effortlessly.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Seamless Collaboration',
    description: 'Foster better communication between students, supervisors, and coordinators in one place.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BookOpen,
    title: 'Resource Management',
    description: 'Centralize all research materials, references, and project documentation securely.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Generate comprehensive insights on departmental performance and project outcomes.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security ensuring all academic data and intellectual property remain protected.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: GraduationCap,
    title: 'Academic Excellence',
    description: 'Elevating the standard of university research through structured monitoring and feedback.',
    color: 'bg-rose-50 text-rose-600',
  }
];
