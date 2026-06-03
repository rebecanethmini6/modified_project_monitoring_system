"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, GraduationCap, User, Mail, BookOpen, Calendar, Phone, Lock } from 'lucide-react';

export function StudentRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    indexNumber: '',
    email: '',
    combination: '',
    academicYear: '',
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 py-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
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

        <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
          <CardHeader className="border-b border-slate-50 pb-6 text-center md:text-left">
            <CardTitle className="text-2xl font-bold text-gray-900">Student Registration</CardTitle>
            <CardDescription className="text-gray-500">
              Create a new student workspace account to track your academic projects
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
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

              {/* Section 2: Academic Classification */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Classification</h3>
                
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
                    <Label htmlFor="academicYear" className="text-sm font-semibold text-gray-700">Academic Year</Label>
                    <Select
                      value={formData.academicYear}
                      onValueChange={(value) => updateField('academicYear', value)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <SelectValue placeholder="Select academic year" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combination" className="text-sm font-semibold text-gray-700">Degree Combination</Label>
                  <Select
                    value={formData.combination}
                    onValueChange={(value) => updateField('combination', value)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <SelectValue placeholder="Select degree combination" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs">Computer Science (CS)</SelectItem>
                      <SelectItem value="cs-math">Computer Science & Mathematics (CS-Math)</SelectItem>
                      <SelectItem value="is">Information Systems (IS)</SelectItem>
                      <SelectItem value="se">Software Engineering (SE)</SelectItem>
                      <SelectItem value="ds">Data Science (DS)</SelectItem>
                    </SelectContent>
                  </Select>
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