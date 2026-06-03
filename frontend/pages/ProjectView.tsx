"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Upload, FileText, Calendar, Star, Award, Download, Eye as EyeIcon, Check, AlertCircle, BookOpen, User, Users, FolderKanban } from 'lucide-react';

export function ProjectView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const isLecturerView = searchParams.get('view') === 'lecturer';
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showOverallRatingDialog, setShowOverallRatingDialog] = useState(false);
  const [selectedProgressId, setSelectedProgressId] = useState<number | null>(null);
  const [overallRating, setOverallRating] = useState('Good');

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const payload = await res.json();
        if (res.ok && payload?.project) {
          // Parse group members from description metadata
          let members: string[] = [];
          let cleanDescription = payload.project.description;
          const parts = payload.project.description.split("\n\n===METADATA===\n");
          if (parts.length > 1) {
            cleanDescription = parts[0];
            try {
              const meta = JSON.parse(parts[1]);
              members = meta.groupMembers?.map((m: any) => `${m.indexNumber} (${m.email})`) || [];
            } catch (e) {
              console.error("Failed to parse metadata", e);
            }
          }
          setProjectData({
            ...payload.project,
            description: cleanDescription,
            members,
            supervisorName: payload.project.supervisor?.fullName || 'Not Assigned',
          });
        }
      } catch (err) {
        console.error("Error loading project:", err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) {
      void fetchProject();
    }
  }, [projectId]);

  const project = projectData ? {
    id: projectData.id,
    title: projectData.title,
    department: projectData.department,
    type: projectData.project_type === 'group' ? 'Group' : 'Individual',
    supervisor: projectData.supervisorName,
    startDate: projectData.submitted_date || '2026-01-15',
    members: (projectData.members || []) as string[],
  } : {
    id: projectId,
    title: 'Loading Project...',
    department: '',
    type: 'Individual',
    supervisor: 'Loading...',
    startDate: '',
    members: [] as string[],
  };

  const [progressEntries, setProgressEntries] = useState([
    {
      id: 1,
      activityNumber: 1,
      title: 'Requirements Gathering',
      description: 'Collected and documented all system requirements',
      startDate: '2026-01-15',
      endDate: '2026-01-30',
      nextSteps: 'Begin database design',
      rating: 'Excellent',
      feedback: 'Great work on comprehensive requirements documentation.',
    },
    {
      id: 2,
      activityNumber: 2,
      title: 'Database Design',
      description: 'Designed relational schema and ER diagrams',
      startDate: '2026-02-01',
      endDate: '2026-02-15',
      nextSteps: 'Implement backend API',
      rating: 'Good',
      feedback: 'Consider normalization for better data integrity.',
    },
  ]);

  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Project Proposal.pdf',
      description: 'Initial project proposal document',
      uploadDate: '2026-01-10',
      feedback: 'Approved. Proceed with implementation.',
    },
    {
      id: 2,
      name: 'Requirements Document.docx',
      description: 'Complete system requirements specification',
      uploadDate: '2026-01-30',
      feedback: 'Well documented. Add more use case diagrams.',
    },
  ]);

  const [newProgress, setNewProgress] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    nextSteps: '',
  });

  const [newDocument, setNewDocument] = useState({
    description: '',
    file: null as File | null,
  });

  const handleAddProgress = () => {
    setProgressEntries([
      ...progressEntries,
      {
        id: progressEntries.length + 1,
        activityNumber: progressEntries.length + 1,
        ...newProgress,
        rating: '',
        feedback: '',
      },
    ]);
    setNewProgress({ title: '', description: '', startDate: '', endDate: '', nextSteps: '' });
    setShowProgressDialog(false);
  };

  const handleSubmitDocument = () => {
    if (newDocument.file) {
      setDocuments([
        ...documents,
        {
          id: documents.length + 1,
          name: newDocument.file.name,
          description: newDocument.description,
          uploadDate: new Date().toISOString().split('T')[0],
          feedback: '',
        },
      ]);
      setNewDocument({ description: '', file: null });
      setShowDocumentDialog(false);
    }
  };

  const handleRateProgress = (progressId: number, rating: string) => {
    setProgressEntries(
      progressEntries.map((entry) =>
        entry.id === progressId ? { ...entry, rating } : entry
      )
    );
    setShowRatingDialog(false);
    setSelectedProgressId(null);
  };

  const handleRateOverallProject = () => {
    alert(`Overall project rated as: ${overallRating}`);
    setShowOverallRatingDialog(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100 h-16 flex items-center px-6 sticky top-0 z-50">
        <Button
          variant="ghost"
          onClick={() => router.push(isLecturerView ? '/lecturer/dashboard' : '/student/dashboard')}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </header>

      <div className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        {loading ? (
          <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg className="animate-spin h-10 w-10 text-[#1E3A8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-base text-gray-500 font-medium">Loading project details...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project Header Info Card */}
        <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl overflow-hidden relative">
          <div className="h-2.5 bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#4F46E5]"></div>
          <CardHeader className="pb-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <Badge className="bg-blue-50 text-[#1E3A8A] hover:bg-blue-50 border border-blue-100 font-semibold rounded-full text-[10px]">
                  {project.type} Research Project
                </Badge>
                <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</CardTitle>
                <CardDescription className="text-gray-500 font-medium">
                  {project.department} Affiliation • Academic Year 2026
                </CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-[#10B981] hover:bg-emerald-50 border border-emerald-100 font-semibold rounded-full text-xs py-1 px-3.5 self-start md:self-auto uppercase">
                Active Project
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="bg-blue-100 text-[#1E3A8A] p-2.5 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Supervisor</span>
                  <span className="font-bold text-gray-800 text-sm mt-0.5 block">{project.supervisor}</span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="bg-indigo-100 text-[#4F46E5] p-2.5 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Date</span>
                  <span className="font-bold text-gray-800 text-sm mt-0.5 block">{project.startDate}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="bg-emerald-100 text-[#10B981] p-2.5 rounded-xl">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Submissions</span>
                  <span className="font-bold text-gray-800 text-sm mt-0.5 block">{documents.length} Files Uploaded</span>
                </div>
              </div>
            </div>

            {project.type === 'Group' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" /> Team Members Index List
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.members.map((member, index) => (
                    <Badge key={index} className="bg-white text-gray-700 border border-slate-200 hover:bg-white rounded-lg px-2.5 py-1 text-xs font-semibold">
                      {member}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isLecturerView && (
              <div className="border-t border-slate-100 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overall Project Grade</span>
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-100 font-bold rounded-lg text-sm mt-1 px-3 py-0.5">
                        {overallRating} Rating
                      </Badge>
                    </div>
                  </div>
                  
                  <Dialog open={showOverallRatingDialog} onOpenChange={setShowOverallRatingDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-slate-200 text-gray-700 font-semibold h-10 px-4 rounded-xl flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Grade Overall Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-950">Grade Overall Project</DialogTitle>
                        <DialogDescription className="text-gray-500">Provide an overall academic rating for this project</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Project Rating</Label>
                          <Select value={overallRating} onValueChange={setOverallRating}>
                            <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-955">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Excellent">Excellent</SelectItem>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Bad">Bad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleRateOverallProject} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
                          Submit Project Rating
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vertical Stepper Timeline Progress Tracking */}
        <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
          <CardHeader className="border-b border-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Project Milestone Timeline</CardTitle>
                <CardDescription className="text-gray-500">
                  {isLecturerView
                    ? 'Review and evaluate specific logged milestone activities and project logs'
                    : 'Log, track, and monitor your research project milestones'}
                </CardDescription>
              </div>
              {!isLecturerView && (
                <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl h-10 px-4">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Progress Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl border-slate-100 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-gray-950">Add Progress Milestone</DialogTitle>
                      <DialogDescription className="text-gray-500">Record a new project activity or milestone</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="progress-title" className="text-sm font-semibold text-gray-700">Milestone Title</Label>
                        <Input
                          id="progress-title"
                          placeholder="e.g. Relational Schema Complete"
                          value={newProgress.title}
                          onChange={(e) => setNewProgress({ ...newProgress, title: e.target.value })}
                          className="h-10 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="progress-description" className="text-sm font-semibold text-gray-700">Milestone Description</Label>
                        <Textarea
                          id="progress-description"
                          placeholder="Summarise what objectives have been accomplished..."
                          value={newProgress.description}
                          onChange={(e) => setNewProgress({ ...newProgress, description: e.target.value })}
                          rows={3}
                          className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date" className="text-sm font-semibold text-gray-700">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={newProgress.startDate}
                            onChange={(e) => setNewProgress({ ...newProgress, startDate: e.target.value })}
                            className="h-10 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-date" className="text-sm font-semibold text-gray-700">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={newProgress.endDate}
                            onChange={(e) => setNewProgress({ ...newProgress, endDate: e.target.value })}
                            className="h-10 border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="next-steps" className="text-sm font-semibold text-gray-700">Next Action Steps</Label>
                        <Textarea
                          id="next-steps"
                          placeholder="What will you work on next?"
                          value={newProgress.nextSteps}
                          onChange={(e) => setNewProgress({ ...newProgress, nextSteps: e.target.value })}
                          rows={2}
                          className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955"
                        />
                      </div>
                      
                      <Button onClick={handleAddProgress} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
                        Log Milestone Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            
            {/* Vertical timeline stepper line */}
            <div className="relative border-l-2 border-slate-200 ml-6 pl-8 space-y-8 py-2">
              {progressEntries.map((entry) => {
                const isCompleted = entry.rating !== '';
                return (
                  <div key={entry.id} className="relative">
                    {/* Stepper Dot circle icon */}
                    <span className={`absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white shadow-sm ${isCompleted ? 'border-emerald-500 text-emerald-500' : 'border-blue-500 text-blue-500'}`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </span>

                    {/* Milestone details wrapper */}
                    <Card className="border-slate-100 shadow-md shadow-slate-100/30 rounded-2xl overflow-hidden hover:border-slate-200 transition-colors">
                      <div className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Milestone Activity #{entry.activityNumber}</span>
                            <h4 className="font-bold text-base text-gray-900 mt-1 leading-snug">{entry.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {entry.rating ? (
                              <Badge className={
                                entry.rating === 'Excellent' 
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 font-bold rounded-lg text-xs' 
                                  : entry.rating === 'Good' 
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100 font-bold rounded-lg text-xs' 
                                  : 'bg-red-50 text-red-700 hover:bg-red-50 border border-red-100 font-bold rounded-lg text-xs'
                              }>
                                {entry.rating} Rating
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-50 text-gray-400 border border-slate-100 hover:bg-slate-50 font-semibold rounded-lg text-xs">
                                Pending Evaluation
                              </Badge>
                            )}

                            {isLecturerView && (
                              <Dialog
                                open={showRatingDialog && selectedProgressId === entry.id}
                                onOpenChange={(open) => {
                                  setShowRatingDialog(open);
                                  if (open) setSelectedProgressId(entry.id);
                                  else setSelectedProgressId(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="border-slate-200 text-gray-700 font-semibold rounded-lg h-8 px-2.5">
                                    <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                                    Grade
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-bold text-gray-950">Grade Milestone</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                      Rate the milestone activity quality for: <strong className="text-gray-800">{entry.title}</strong>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 pt-4">
                                    <Button onClick={() => handleRateProgress(entry.id, 'Excellent')} className="w-full h-11 bg-emerald-55 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl" variant="ghost">Excellent</Button>
                                    <Button onClick={() => handleRateProgress(entry.id, 'Good')} className="w-full h-11 bg-blue-55 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl" variant="ghost">Good</Button>
                                    <Button onClick={() => handleRateProgress(entry.id, 'Bad')} className="w-full h-11 bg-red-55 hover:bg-red-100 text-red-800 border border-red-200 font-bold rounded-xl" variant="ghost">Bad</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">{entry.description}</p>

                        <div className="border-t border-slate-50 pt-3 flex flex-wrap gap-6 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Logged Period: <strong className="text-gray-700 font-semibold">{entry.startDate} to {entry.endDate}</strong></span>
                          </div>
                          
                          {entry.nextSteps && (
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                              <span>Next Task: <strong className="text-gray-700 font-semibold">{entry.nextSteps}</strong></span>
                            </div>
                          )}
                        </div>

                        {entry.feedback && (
                          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs">
                            <span className="font-bold text-blue-800 uppercase block mb-1">Supervisor feedback:</span>
                            <span className="text-blue-700 leading-relaxed">{entry.feedback}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>

          </CardContent>
        </Card>

        {/* Document Submissions Card Deck */}
        <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
          <CardHeader className="border-b border-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Document Upload Repository</CardTitle>
                <CardDescription className="text-gray-500">
                  {isLecturerView 
                    ? 'Review and read document uploads submitted by the project team' 
                    : 'Upload, manage, and download formal project documents and deliverables'}
                </CardDescription>
              </div>
              {!isLecturerView && (
                <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl h-10 px-4">
                      <Upload className="w-4 h-4 mr-1.5" />
                      Submit Deliverable File
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-slate-100 rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-gray-950">Submit Document</DialogTitle>
                      <DialogDescription className="text-gray-500">Upload a formal report or document proposal</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-description" className="text-sm font-semibold text-gray-700">Document Description</Label>
                        <Textarea
                          id="doc-description"
                          placeholder="Describe the content of this file submission..."
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                          rows={3}
                          className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-955 resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Select File</Label>
                        <div className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] transition-colors rounded-2xl p-6 text-center bg-slate-50/50">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 mb-3">PDF, DOC, DOCX up to 10MB</p>
                          <Input
                            type="file"
                            onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files?.[0] || null })}
                            accept=".pdf,.doc,.docx"
                            className="max-w-xs mx-auto text-xs bg-white border-slate-200"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={handleSubmitDocument} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
                        Submit Deliverable File
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-slate-100 shadow-md shadow-slate-100/30 rounded-2xl hover:border-slate-200 transition-colors flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 text-[#1E3A8A] p-3 rounded-2xl flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 truncate">
                        <h4 className="font-bold text-gray-900 truncate leading-snug">{doc.name}</h4>
                        <span className="block text-[10px] text-gray-400 font-mono">Uploaded on {doc.uploadDate}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>

                    {doc.feedback && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-xs">
                        <span className="font-bold text-emerald-800 uppercase block mb-1">Supervisor Notes:</span>
                        <span className="text-emerald-700 leading-relaxed">{doc.feedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => alert(`Viewing document: ${doc.name}`)}
                      className="flex-1 h-9 rounded-xl border-slate-200 text-gray-700 font-semibold"
                    >
                      <EyeIcon className="w-3.5 h-3.5 mr-1" /> View File
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => alert(`Downloading: ${doc.name}`)}
                      className="flex-1 h-9 rounded-xl border-slate-200 text-gray-700 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}