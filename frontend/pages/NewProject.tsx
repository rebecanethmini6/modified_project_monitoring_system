"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';

export function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<'individual' | 'group'>('individual');
  const [groupMembers, setGroupMembers] = useState<Array<{ indexNumber: string; email: string }>>([
    { indexNumber: '', email: '' }
  ]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [formData, setFormData] = useState({
    department: '',
    title: '',
    description: '',
    aims: '',
    objectives: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMember = () => {
    setGroupMembers([...groupMembers, { indexNumber: '', email: '' }]);
  };

  const removeMember = (index: number) => {
    setGroupMembers(groupMembers.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'indexNumber' | 'email', value: string) => {
    const updated = [...groupMembers];
    updated[index] = { ...updated[index], [field]: value };
    setGroupMembers(updated);
  };

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await fetch('/api/lecturers');
        const payload = await response.json();
        if (response.ok && payload?.lecturers) {
          setSupervisors(payload.lecturers);
        }
      } catch (err) {
        console.error('Failed to load supervisors:', err);
      }
    };
    void fetchSupervisors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const ownerId = authData?.user?.id;

      if (!ownerId) {
        throw new Error('You must be logged in to create a project.');
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: projectType,
          ownerId,
          supervisorId: selectedSupervisorId || null,
          groupMembers: projectType === 'group' ? groupMembers.filter((member) => member.indexNumber.trim() || member.email.trim()) : [],
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Project request failed.');
      }

      alert('Project request submitted and confirmation emails have been sent successfully!');
      router.push('/student/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Project submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100 h-16 flex items-center px-6 sticky top-0 z-50">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/student/dashboard')}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </header>

      <div className="max-w-3xl mx-auto p-4 py-8">
        <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-2xl font-bold text-gray-900">Create New Project Proposal</CardTitle>
            <CardDescription className="text-gray-500">
              Submit your project objectives and classification to request a supervisor assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Classification Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Classification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold text-gray-700">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => updateField('department', value)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">Computer Science (CS)</SelectItem>
                        <SelectItem value="it">Information Technology (IT)</SelectItem>
                        <SelectItem value="se">Software Engineering (SE)</SelectItem>
                        <SelectItem value="ds">Data Science (DS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Project Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="h-11 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Project Type */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Type</h3>
                
                <div className="space-y-2">
                  <RadioGroup
                    value={projectType}
                    onValueChange={(value: 'individual' | 'group') => setProjectType(value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div 
                      onClick={() => setProjectType('individual')}
                      className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${projectType === 'individual' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <RadioGroupItem value="individual" id="individual" className="text-[#1E3A8A]" />
                      <Label htmlFor="individual" className="cursor-pointer font-bold text-gray-800 text-sm">
                        Individual Project
                      </Label>
                    </div>

                    <div 
                      onClick={() => setProjectType('group')}
                      className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${projectType === 'group' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <RadioGroupItem value="group" id="group" className="text-[#1E3A8A]" />
                      <Label htmlFor="group" className="cursor-pointer font-bold text-gray-800 text-sm">
                        Group Project
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {projectType === 'group' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Members (Index & Email)</Label>
                    <div className="space-y-2">
                      {groupMembers.map((member, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 items-center">
                          <Input
                            placeholder="Index (e.g. 2021/CS/001)"
                            value={member.indexNumber}
                            onChange={(e) => updateMember(index, 'indexNumber', e.target.value)}
                            className="h-10 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955 bg-white flex-1"
                          />
                          <Input
                            placeholder="Email (e.g. member@test.com)"
                            type="email"
                            value={member.email}
                            onChange={(e) => updateMember(index, 'email', e.target.value)}
                            className="h-10 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955 bg-white flex-1"
                          />
                          {groupMembers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeMember(index)}
                              className="text-red-500 hover:bg-red-50 border-slate-200 h-10 w-10 flex-shrink-0 rounded-xl"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addMember}
                      className="border-slate-200 text-gray-700 rounded-xl h-9 hover:bg-white"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Member
                    </Button>
                  </div>
                )}
              </div>

              {/* Supervisor Assignment */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Supervisor Assignment</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="supervisor" className="text-sm font-semibold text-gray-700">Choose Supervisor Name</Label>
                  <Select
                    value={selectedSupervisorId}
                    onValueChange={setSelectedSupervisorId}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-955 bg-white">
                      <SelectValue placeholder="Select a supervisor from registered faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.length > 0 ? (
                        supervisors.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.full_name} ({sup.email}) - {sup.department}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_empty" disabled>
                          No supervisors registered in the system
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Scope details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scope and Objectives</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a comprehensive summary of the project background, goals, and methodologies..."
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aims" className="text-sm font-semibold text-gray-700">Aims</Label>
                    <Textarea
                      id="aims"
                      placeholder="What is the high-level intent of the research?"
                      value={formData.aims}
                      onChange={(e) => updateField('aims', e.target.value)}
                      rows={3}
                      className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objectives" className="text-sm font-semibold text-gray-700">Objectives</Label>
                    <Textarea
                      id="objectives"
                      placeholder="List the specific technical steps/milestones (e.g. 1. Normalise database, 2. Build API)"
                      value={formData.objectives}
                      onChange={(e) => updateField('objectives', e.target.value)}
                      rows={3}
                      className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Document attachment dropzone */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Proposal Attachment</h3>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Proposal Document (Optional)</Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] transition-colors rounded-2xl p-6 text-center bg-slate-50/50">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-semibold mb-3">
                      PDF, DOC, or DOCX up to 10MB
                    </p>
                    <Input
                      type="file"
                      className="max-w-xs mx-auto text-xs border-slate-200 bg-white"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-blue-900/10" 
                disabled={loading}
              >
                {loading ? 'Submitting Request...' : 'Submit Project Proposal'}
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