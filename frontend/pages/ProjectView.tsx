"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatRatingLabel, hasNumericRating, RATING_OPTIONS, ratingBadgeClass } from '../lib/ratings';
import { ArrowLeft, Plus, Upload, FileText, Calendar, Star, Award, Download, Eye as EyeIcon, Check, AlertCircle, BookOpen, User, Users, FolderKanban, XCircle } from 'lucide-react';

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
  const [showStudentRatingDialog, setShowStudentRatingDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedProgressId, setSelectedProgressId] = useState<number | null>(null);
  const [overallRating, setOverallRating] = useState('5');
  const [milestoneComment, setMilestoneComment] = useState('');
  const [studentRating, setStudentRating] = useState('5');
  const [selectedStudentRating, setSelectedStudentRating] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progressEntries, setProgressEntries] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const payload = await res.json();
      if (res.ok && payload?.project) {
        const proj = payload.project;
        // Description and group members are already parsed server-side.
        const members: string[] = (proj.groupMembers ?? []).map(
          (m: any) => `${m.indexNumber}${m.email ? ` (${m.email})` : ''}`,
        );
        setProjectData({
          ...proj,
          members,
          supervisorName: proj.supervisor?.fullName || proj.supervisorName || 'Not Assigned',
        });
        if (hasNumericRating(proj.overallRating)) {
          setOverallRating(String(proj.overallRating));
        }
        setProgressEntries(
          (proj.progressEntries ?? []).map((e: any) => ({
            id: e.id,
            activityNumber: e.activity_number,
            title: e.title,
            description: e.description ?? '',
            startDate: e.start_date ?? '',
            endDate: e.end_date ?? '',
            nextSteps: e.next_steps ?? '',
            rating: e.rating ?? '',
            feedback: e.feedback ?? '',
          })),
        );
        setDocuments(
          (proj.documents ?? []).map((d: any) => ({
            id: d.id,
            name: d.file_name,
            description: d.description ?? '',
            uploadDate: d.upload_date ?? '',
            feedback: d.feedback ?? '',
            url: d.url ?? '',
          })),
        );
      }
    } catch (err) {
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) void fetchProject();
    // Capture the logged-in user's ID for owner checks
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [projectId, fetchProject]);

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

  // Is the current user the project owner?
  const isProjectOwner = !!currentUserId && !!projectData?.owner_id && projectData.owner_id === currentUserId;
  const isProjectCompleted = projectData?.status === 'completed';

  const handleCloseProject = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          progress: 100,
          completed_date: today,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? 'Failed to close project.');
      setShowCloseDialog(false);
      // Refresh project data to reflect completed state
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to close project.');
    } finally {
      setSaving(false);
    }
  };

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

  /** Safely parse a fetch Response as JSON. If the server returns an HTML
   *  error page (Next.js 500/404), this converts it into a readable Error
   *  instead of throwing the cryptic "Unexpected token '<'" message. */
  const safeJson = async (res: Response): Promise<any> => {
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server error (${res.status}): the API returned an unexpected response. Check the server console for details.`);
    }
    return res.json();
  };

  const handleAddProgress = async () => {
    if (!newProgress.title.trim()) {
      alert('Please enter a milestone title.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProgress),
      });
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.error ?? 'Failed to add milestone.');
      setNewProgress({ title: '', description: '', startDate: '', endDate: '', nextSteps: '' });
      setShowProgressDialog(false);
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add milestone.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!newDocument.file) {
      alert('Please choose a file.');
      return;
    }
    setSaving(true);
    try {
      // Determine the uploading student (the project owner / current user).
      const { data: authData } = await supabaseClient.auth.getUser();
      const uploadedBy = projectData?.owner_id ?? authData?.user?.id;

      const uploadForm = new FormData();
      uploadForm.append('file', newDocument.file);
      if (uploadedBy) uploadForm.append('ownerId', uploadedBy);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
      const uploadPayload = await safeJson(uploadRes);
      if (!uploadRes.ok) throw new Error(uploadPayload?.error ?? 'File upload failed.');

      const docRes = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedBy,
          fileName: uploadPayload.filename,
          description: newDocument.description,
          storagePath: uploadPayload.path,
        }),
      });
      const docPayload = await safeJson(docRes);
      if (!docRes.ok) throw new Error(docPayload?.error ?? 'Failed to save document.');

      setNewDocument({ description: '', file: null });
      setShowDocumentDialog(false);
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to submit document.');
    } finally {
      setSaving(false);
    }
  };

  const handleRateProgress = async (progressId: number) => {
    const feedback = milestoneComment.trim();
    if (!feedback) return;
    setSaving(true);
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const res = await fetch(`/api/progress/${progressId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback || undefined,
          ratedBy: authData?.user?.id,
        }),
      });
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.error ?? 'Grading failed.');
      setShowRatingDialog(false);
      setSelectedProgressId(null);
      setMilestoneComment('');
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Grading failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRateOverallProject = async () => {
    const rating = parseInt(overallRating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) return;
    setSaving(true);
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const res = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, ratedBy: authData?.user?.id }),
      });
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.error ?? 'Rating failed.');
      setShowOverallRatingDialog(false);
      alert(`Overall project rated: ${formatRatingLabel(rating)}`);
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Rating failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRateStudent = async () => {
    if (!selectedStudentRating) return;

    const rating = parseInt(studentRating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) return;

    setSaving(true);
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const ratedBy = authData?.user?.id;
      if (!ratedBy) {
        throw new Error('Please sign in before rating students.');
      }

      const res = await fetch(`/api/projects/${projectId}/student-ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentKey: selectedStudentRating.key,
          rating,
          ratedBy,
        }),
      });

      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.error ?? 'Student rating failed.');

      setShowStudentRatingDialog(false);
      setSelectedStudentRating(null);
      setStudentRating('5');
      await fetchProject();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Student rating failed.');
    } finally {
      setSaving(false);
    }
  };

  const projectStudents = projectData
    ? [
        ...(projectData.owner_id || projectData.ownerName || projectData.ownerIndex || projectData.ownerEmail
          ? [{
              key: `owner:${projectData.owner_id ?? projectData.ownerIndex ?? projectData.ownerEmail ?? 'unknown'}`,
              name: projectData.ownerName ?? null,
              indexNumber: projectData.ownerIndex ?? null,
              email: projectData.ownerEmail ?? null,
              role: 'owner' as const,
            }]
          : []),
        ...((projectData.groupMembers ?? []).map((member: any) => {
          const indexNumber = (member.indexNumber ?? '').trim();
          const email = (member.email ?? '').trim();
          return {
            key: `member:${indexNumber.toLowerCase()}:${email.toLowerCase()}`,
            name: null,
            indexNumber: indexNumber || null,
            email: email || null,
            role: 'member' as const,
          };
        })),
      ]
    : [];

  const getStudentRating = (studentKey: string) =>
    (projectData?.studentRatings ?? []).find((rating: any) => rating.student_key === studentKey);

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
              <Badge className={`font-semibold rounded-full text-xs py-1 px-3.5 self-start md:self-auto uppercase border ${
                isProjectCompleted
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-emerald-50 text-[#10B981] border-emerald-100'
              }`}>
                {isProjectCompleted ? 'Completed' : 'Active Project'}
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

            {/* Close Project – only shown to the project owner on an active project */}
            {!isLecturerView && isProjectOwner && !isProjectCompleted && (
              <div className="border border-rose-100 bg-rose-50/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-rose-800">Close this project</p>
                  <p className="text-xs text-rose-600">
                    Mark this project as completed. This cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCloseDialog(true)}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold rounded-xl h-10 px-5 flex-shrink-0"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Project
                </Button>
              </div>
            )}

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
                      <Badge className={`${ratingBadgeClass(overallRating)} rounded-lg text-sm mt-1 px-3 py-0.5`}>
                        {hasNumericRating(overallRating) ? formatRatingLabel(overallRating) : 'Not rated yet'}
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
                          <Label className="text-sm font-semibold text-gray-700">Project Rating (1-10)</Label>
                          <Select value={overallRating} onValueChange={setOverallRating}>
                            <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-955">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RATING_OPTIONS.map((score) => (
                                <SelectItem key={score} value={String(score)}>{score}/10</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleRateOverallProject} disabled={saving} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
                          {saving ? 'Saving...' : 'Submit Project Rating'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Student ratings</p>
                      <p className="text-sm font-semibold text-gray-800">Rate each student on a 1 to 10 scale</p>
                    </div>
                    <Badge className="bg-white text-gray-600 border border-slate-200 rounded-full text-[10px] font-semibold">
                      {projectStudents.length} student{projectStudents.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projectStudents.map((student) => {
                      const existingRating = getStudentRating(student.key);
                      const displayName = student.name ?? student.indexNumber ?? student.email ?? 'Student';

                      return (
                        <div key={student.key} className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
                              <Badge className="bg-slate-50 text-gray-500 hover:bg-slate-50 border border-slate-100 font-semibold rounded-full text-[10px] uppercase">
                                {student.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {student.indexNumber ?? 'No index'}{student.email ? ` (${student.email})` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 sm:flex-shrink-0">
                            {existingRating?.rating ? (
                              <Badge className={ratingBadgeClass(existingRating.rating)}>{formatRatingLabel(existingRating.rating)}</Badge>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">Not rated</span>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStudentRating(student);
                                setStudentRating(hasNumericRating(existingRating?.rating) ? String(existingRating.rating) : '5');
                                setShowStudentRatingDialog(true);
                              }}
                              className="h-8 rounded-lg border-slate-200 text-gray-700 px-2.5"
                            >
                              <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                              {existingRating?.rating ? 'Re-rate' : 'Rate'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {projectStudents.length === 0 && (
                      <p className="text-sm text-gray-400 italic">No students found for this project.</p>
                    )}
                  </div>
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
                const isCompleted = hasNumericRating(entry.rating);
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
                              <Badge className={`${ratingBadgeClass(entry.rating)} rounded-lg text-xs`}>
                                {formatRatingLabel(entry.rating)}
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
                                  if (open) {
                                    setSelectedProgressId(entry.id);
                                    setMilestoneComment(entry.feedback ?? '');
                                  } else {
                                    setSelectedProgressId(null);
                                    setMilestoneComment('');
                                  }
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
                                    <DialogTitle className="text-lg font-bold text-gray-950">Comment on Progress</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                      Leave lecturer feedback for: <strong className="text-gray-800">{entry.title}</strong>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-semibold text-gray-700">Comment</Label>
                                      <Textarea
                                        value={milestoneComment}
                                        onChange={(e) => setMilestoneComment(e.target.value)}
                                        placeholder="Write feedback on the student's progress, strengths, or what should improve next..."
                                        rows={4}
                                        className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950 resize-none"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleRateProgress(entry.id)}
                                      disabled={saving}
                                      className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl"
                                    >
                                      {saving ? 'Saving...' : 'Submit Comment'}
                                    </Button>
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

        <Dialog
          open={showStudentRatingDialog}
          onOpenChange={(open) => {
            setShowStudentRatingDialog(open);
            if (!open) {
              setSelectedStudentRating(null);
              setStudentRating('5');
            }
          }}
        >
          <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-950">Rate Student</DialogTitle>
              <DialogDescription className="text-gray-500">
                Give a score from 1 to 10 for <strong className="text-gray-700">{selectedStudentRating?.name ?? selectedStudentRating?.indexNumber ?? selectedStudentRating?.email ?? 'this student'}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Score (1-10)</Label>
                <Select value={studentRating} onValueChange={setStudentRating}>
                  <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map((score) => (
                      <SelectItem key={score} value={String(score)}>{score}/10</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRateStudent} disabled={saving} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
                {saving ? 'Saving...' : 'Submit Rating'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Close Project Confirmation Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={(o) => { if (!o) setShowCloseDialog(false); }}>
          <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-950">Close Project?</DialogTitle>
              <DialogDescription className="text-gray-500">
                This will mark <strong className="text-gray-800">{project.title}</strong> as{' '}
                <strong className="text-rose-600">Completed</strong> and set progress to 100%. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 text-gray-700 rounded-xl h-11"
                onClick={() => setShowCloseDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseProject}
                disabled={saving}
                className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
              >
                {saving ? 'Closing...' : 'Yes, Close Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                    <a href={doc.url || '#'} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!doc.url}
                        className="w-full h-9 rounded-xl border-slate-200 text-gray-700 font-semibold"
                      >
                        <EyeIcon className="w-3.5 h-3.5 mr-1" /> View File
                      </Button>
                    </a>

                    <a href={doc.url || '#'} target="_blank" rel="noopener noreferrer" download className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!doc.url}
                        className="w-full h-9 rounded-xl border-slate-200 text-gray-700 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download
                      </Button>
                    </a>
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