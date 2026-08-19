"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, GraduationCap, User, Mail, Calendar, Phone, Lock } from 'lucide-react';

export function StudentRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    indexNumber: '',
    email: '',
    registrationDate: '',
    contactNumber: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Student registration failed.');
      }

      alert('Registration successful! Please login.');
      router.push('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/login.jpg')" }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[#062b74]/35 backdrop-blur-[1px]" />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col space-y-4 py-2">
        <div className="flex shrink-0 items-center justify-between rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg shadow-blue-950/15 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')} 
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>

          <div className="flex items-center gap-2 text-[#1E3A8A] font-bold">
            <GraduationCap className="w-6 h-6" />
            <span className="text-sm tracking-wider uppercase">University Portal</span>
          </div>
        </div>

        <Card className="min-h-0 flex flex-1 flex-col border-white/70 bg-white/95 shadow-xl shadow-blue-950/25 rounded-2xl backdrop-blur-sm">
          <CardHeader className="border-b border-slate-50 pb-6 text-center md:text-left">
            <CardTitle className="text-2xl font-bold text-gray-900">Student Registration</CardTitle>
            <CardDescription className="text-gray-500">
              Create a new student workspace account to track your academic projects
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-sm font-semibold text-gray-700">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={formData.contactNumber}
                        onChange={(e) => updateField('contactNumber', e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student.name@university.edu"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Registration Information */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registration Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="indexNumber" className="text-sm font-semibold text-gray-700">Index Number</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="indexNumber"
                        placeholder="2021/CS/001"
                        value={formData.indexNumber}
                        onChange={(e) => updateField('indexNumber', e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDate" className="text-sm font-semibold text-gray-700">Registration Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="registrationDate" type="date" min="2023-01-01" max="2026-12-31" value={formData.registrationDate} onChange={(e) => updateField('registrationDate', e.target.value)} className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950" required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Credentials */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Password</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong security password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-blue-900/10" 
                disabled={loading}
              >
                {loading ? 'Creating Workspace Account...' : 'Complete Registration'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-700 text-xs p-3.5 rounded-xl">
                <span className="font-medium">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
