"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { formatRatingLabel, hasNumericRating, RATING_OPTIONS, ratingBadgeClass } from '../lib/ratings';
import { getCurrentStudyYear } from '../lib/academic';
import {
  GraduationCap, LogOut, UserCheck, ClipboardList, Star, MessageSquare, Eye, Menu, Bell,
  User, Users, ClipboardCheck, BookOpen, Download, Filter, X,
} from 'lucide-react';

type ProjectStatusFilter = 'all' | 'current' | 'completed';
type ProjectTypeFilter = 'all' | 'group' | 'individual';

type ProjectFilters = {
  studentId: string;
  projectType: ProjectTypeFilter;
  status: ProjectStatusFilter;
  studyYear: string;
};

type ProjectStudent = {
  key: string;
  name: string | null;
  indexNumber: string | null;
  email: string | null;
  role: 'owner' | 'member';
};

const emptyProjectFilters: ProjectFilters = {
  studentId: '',
  projectType: 'all',
  status: 'all',
  studyYear: 'all',
};

function hasActiveFilters(filters: ProjectFilters) {
  return (
    filters.studentId.trim() !== '' ||
    filters.projectType !== 'all' ||
    filters.status !== 'all' ||
    filters.studyYear !== 'all'
  );
}

function matchesProjectFilters(project: any, filters: ProjectFilters) {
  if (filters.studentId.trim()) {
    const query = filters.studentId.trim().toLowerCase();
    const ownerMatch = (project.ownerIndex ?? '').toLowerCase().includes(query);
    const memberMatch = (project.groupMembers ?? []).some((m: { indexNumber?: string }) =>
      (m.indexNumber ?? '').toLowerCase().includes(query),
    );
    if (!ownerMatch && !memberMatch) return false;
  }

  if (filters.projectType === 'group' && project.project_type !== 'group') return false;
  if (filters.projectType === 'individual' && project.project_type === 'group') return false;

  const isCompleted = project.status === 'completed' || Number(project.progress) >= 100;
  if (filters.status === 'completed' && !isCompleted) return false;
  if (filters.status === 'current' && isCompleted) return false;

  if (filters.studyYear !== 'all') {
    if (!project.ownerRegistrationDate) return false;
    if (getCurrentStudyYear(project.ownerRegistrationDate) !== filters.studyYear) return false;
  }

  return true;
}

function getProjectStudents(project: any): ProjectStudent[] {
  const students: ProjectStudent[] = [];

  if (project.owner_id || project.ownerName || project.ownerIndex || project.ownerEmail) {
    students.push({
      key: `owner:${project.owner_id ?? project.ownerIndex ?? project.ownerEmail ?? 'unknown'}`,
      name: project.ownerName ?? null,
      indexNumber: project.ownerIndex ?? null,
      email: project.ownerEmail ?? null,
      role: 'owner',
    });
  }

  for (const member of project.groupMembers ?? []) {
    const indexNumber = (member.indexNumber ?? '').trim();
    const email = (member.email ?? '').trim();
    if (!indexNumber && !email) continue;

    students.push({
      key: `member:${indexNumber.toLowerCase()}:${email.toLowerCase()}`,
      name: null,
      indexNumber: indexNumber || null,
      email: email || null,
      role: 'member',
    });
  }

  return students;
}

function getStudentRating(project: any, studentKey: string) {
  return (project.studentRatings ?? []).find((rating: any) => rating.student_key === studentKey);
}

function ProjectFiltersBar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  resultCount: number;
  totalCount: number;
}) {
  const active = hasActiveFilters(filters);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-[#1E3A8A]" />
          Filter projects
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <span className="text-xs text-gray-500">
              Showing {resultCount} of {totalCount}
            </span>
          )}
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(emptyProjectFilters)}
              className="h-8 px-2 text-gray-500 hover:text-gray-800"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500">Student ID</Label>
          <Input
            value={filters.studentId}
            onChange={(e) => onChange({ ...filters, studentId: e.target.value })}
            placeholder="e.g. IT/2021/001"
            className="h-10 border-slate-200 bg-white rounded-xl text-gray-950"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500">Project type</Label>
          <Select
            value={filters.projectType}
            onValueChange={(value: ProjectTypeFilter) => onChange({ ...filters, projectType: value })}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-gray-950">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="group">Group projects</SelectItem>
              <SelectItem value="individual">Individual projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: ProjectStatusFilter) => onChange({ ...filters, status: value })}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-gray-950">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="current">Current projects</SelectItem>
              <SelectItem value="completed">Completed projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500">Study year</Label>
          <Select
            value={filters.studyYear}
            onValueChange={(value: string) => onChange({ ...filters, studyYear: value })}
          >
            <SelectTrigger className="h-10 border-slate-200 bg-white rounded-xl text-gray-950">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              <SelectItem value="First Year">First Year</SelectItem>
              <SelectItem value="Second Year">Second Year</SelectItem>
              <SelectItem value="Third Year">Third Year</SelectItem>
              <SelectItem value="Fourth Year">Fourth Year</SelectItem>
              <SelectItem value="Graduate">Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

const departmentLabels: Record<string, string> = {
  cs: 'Computer Science',
  im: 'Industrial Management',
  ms: 'Mathematics and Statistics',
  ee: 'Electronics',
};

export function LecturerDashboard() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const [lecturerData, setLecturerData] = useState({
    lecturerId: '', fullName: '', email: '', department: '', contactNumber: '', role: '',
  });
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [coordinatorProjects, setCoordinatorProjects] = useState<any[]>([]);
  const [supervisedProjects, setSupervisedProjects] = useState<any[]>([]);
  // Flattened review data across supervised projects
  const [reviewProgress, setReviewProgress] = useState<any[]>([]);
  const [reviewDocuments, setReviewDocuments] = useState<any[]>([]);

  // Dialog state
  const [assignProject, setAssignProject] = useState<any>(null);
  const [assignSupervisorId, setAssignSupervisorId] = useState<string>('');
  const [gradeEntry, setGradeEntry] = useState<any>(null);
  const [feedbackDoc, setFeedbackDoc] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [busy, setBusy] = useState(false);
  const [gradeRating, setGradeRating] = useState('5');
  const [coordinatorFilters, setCoordinatorFilters] = useState<ProjectFilters>(emptyProjectFilters);
  const [supervisedFilters, setSupervisedFilters] = useState<ProjectFilters>(emptyProjectFilters);

  const loadData = useCallback(async (uid: string) => {
    // Faculty list for assignment dropdown
    try {
      const r = await fetch('/api/lecturers');
      const p = await r.json();
      if (r.ok && p?.lecturers) setLecturers(p.lecturers);
    } catch { /* ignore */ }

    // Coordinator projects (assigned to me as coordinator)
    try {
      const r = await fetch(`/api/projects?coordinatorId=${encodeURIComponent(uid)}`);
      const p = await r.json();
      if (r.ok && p?.projects) setCoordinatorProjects(p.projects);
    } catch { /* ignore */ }

    // Supervised projects (assigned to me as supervisor) + their details
    try {
      const r = await fetch(`/api/projects?supervisorId=${encodeURIComponent(uid)}`);
      const p = await r.json();
      const sup = r.ok && p?.projects ? p.projects : [];
      setSupervisedProjects(sup);

      const details = await Promise.all(
        sup.map(async (proj: any) => {
          try {
            const dr = await fetch(`/api/projects/${proj.id}`);
            const dp = await dr.json();
            return dr.ok && dp?.project ? dp.project : null;
          } catch {
            return null;
          }
        }),
      );

      setSupervisedProjects(details.map((project, index) => project ?? sup[index]));

      const progress: any[] = [];
      const docs: any[] = [];
      for (const d of details) {
        if (!d) continue;
        for (const e of d.progressEntries ?? []) progress.push({ ...e, projectTitle: d.title });
        for (const doc of d.documents ?? []) docs.push({ ...doc, projectTitle: d.title });
      }
      setReviewProgress(progress);
      setReviewDocuments(docs);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseClient.auth.getUser();
      const user = data.user;
      if (!user) {
        router.push('/');
        return;
      }
      setUserId(user.id);

      const response = await fetch(`/api/lecturer/profile?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? '')}`);
      const payload = await response.json();
      if (response.ok && payload?.lecturer) {
        setLecturerData(payload.lecturer);
      } else {
        const m = user.user_metadata ?? {};
        setLecturerData({
          lecturerId: m.lecturer_id ?? '',
          fullName: m.full_name ?? '',
          email: user.email ?? '',
          department: m.department_label ?? departmentLabels[m.department] ?? m.department ?? '',
          contactNumber: m.contact_number ?? '',
          role: m.role ?? '',
        });
      }

      await loadData(user.id);
      setLoading(false);
    };
    void init();
  }, [router, loadData]);

  const pendingProjects = coordinatorProjects.filter((p) => !p.supervisor_id);
  const filteredCoordinatorProjects = coordinatorProjects.filter((p) =>
    matchesProjectFilters(p, coordinatorFilters),
  );
  const filteredSupervisedProjects = supervisedProjects.filter((p) =>
    matchesProjectFilters(p, supervisedFilters),
  );

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  const handleAssignSupervisor = async () => {
    if (!assignProject || !assignSupervisorId) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/projects/${assignProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisor_id: assignSupervisorId }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p?.error ?? 'Assignment failed.');
      setAssignProject(null);
      setAssignSupervisorId('');
      await loadData(userId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Assignment failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGradeProgress = async () => {
    if (!gradeEntry) return;
    const rating = parseInt(gradeRating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/progress/${gradeEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, ratedBy: userId }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p?.error ?? 'Grading failed.');
      setGradeEntry(null);
      setGradeRating('5');
      await loadData(userId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Grading failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackDoc || !feedbackText.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/documents/${feedbackDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText, reviewedBy: userId }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p?.error ?? 'Feedback failed.');
      setFeedbackDoc(null);
      setFeedbackText('');
      await loadData(userId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Feedback failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-500 hover:bg-slate-50">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-[#1E3A8A] p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-gray-900">Project Monitoring System</h1>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Faculty Portal</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleLogout} className="border-slate-200 text-gray-700 hover:bg-slate-50 rounded-xl">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row flex-1">
        <aside className={`bg-white border-r border-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col justify-between flex-shrink-0`}>
          <div>
            <div className={`p-4 border-b border-slate-50 flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] font-bold flex items-center justify-center flex-shrink-0">
                {lecturerData.fullName ? lecturerData.fullName[0].toUpperCase() : 'L'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{lecturerData.fullName || 'Faculty Member'}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lecturerData.lecturerId || 'Lecturer'}</p>
                </div>
              )}
            </div>

            <TabsList className="flex flex-col h-auto bg-transparent border-0 space-y-1 p-3">
              <TabsTrigger value="profile" className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]">
                <User className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Faculty Profile</span>}
              </TabsTrigger>
              <TabsTrigger value="coordinator" className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]">
                <ClipboardList className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>Coordinator Projects</span>
                    {pendingProjects.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-semibold px-2 py-0.5 text-[10px] rounded-full">{pendingProjects.length}</Badge>
                    )}
                  </div>
                )}
              </TabsTrigger>
              <TabsTrigger value="supervised" className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]">
                <Users className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Supervised Projects</span>}
              </TabsTrigger>
              <TabsTrigger value="review" className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]">
                <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Review & Feedback</span>}
              </TabsTrigger>
            </TabsList>
          </div>
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-slate-50 text-center">
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider">FACULTY DASHBOARD • v1.2</span>
            </div>
          )}
        </aside>

        <main className="flex-1 p-6 md:p-8 bg-[#F8FAFC] overflow-y-auto">
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#4F46E5] text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-blue-900/5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {lecturerData.fullName || 'Faculty Member'}</h2>
              <p className="text-blue-100 text-sm md:text-base font-medium max-w-lg">Manage student project registrations, evaluate milestones, and provide constructive academic feedback.</p>
            </div>
            <div className="flex gap-4 relative z-10 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Department</span>
                <span className="text-sm font-bold">{lecturerData.department || 'Faculty'}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Supervising</span>
                <span className="text-sm font-bold">{supervisedProjects.length} Projects</span>
              </div>
            </div>
          </div>

          {/* Profile */}
          <TabsContent value="profile" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-gray-900">Faculty Member Profile</CardTitle>
                <CardDescription className="text-gray-500">Your professional university details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Loading faculty workspace profile...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField label="Lecturer ID" value={lecturerData.lecturerId} />
                    <ProfileField label="Full Name" value={lecturerData.fullName} />
                    <ProfileField label="Email Address" value={lecturerData.email} />
                    <ProfileField label="Department" value={lecturerData.department} />
                    <ProfileField label="Contact Number" value={lecturerData.contactNumber} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coordinator */}
          <TabsContent value="coordinator" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Project Proposals Assigned to You</CardTitle>
                <CardDescription className="text-gray-500">Assign academic supervisors to student project proposals</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <ProjectFiltersBar
                  filters={coordinatorFilters}
                  onChange={setCoordinatorFilters}
                  resultCount={filteredCoordinatorProjects.length}
                  totalCount={coordinatorProjects.length}
                />
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Project Title</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Students & Ratings</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Type</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Submitted</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Supervisor</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoordinatorProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 py-4 px-4 max-w-xs truncate">{project.title}</TableCell>
                          <TableCell className="text-gray-700 py-4 px-4">{project.ownerName ?? '—'}{project.ownerIndex ? ` (${project.ownerIndex})` : ''}</TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 font-semibold rounded-full text-[10px]">
                              {project.project_type === 'group' ? 'Group' : 'Individual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 py-4 px-4 font-mono text-xs">{project.submitted_date}</TableCell>
                          <TableCell className="py-4 px-4 text-gray-700">{project.supervisorName ?? <span className="text-amber-600 italic text-xs">Unassigned</span>}</TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            {!project.supervisor_id ? (
                              <Button
                                size="sm"
                                onClick={() => { setAssignProject(project); setAssignSupervisorId(''); }}
                                className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl px-3.5 h-9"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                Assign Supervisor
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 font-semibold rounded-full text-[10px] px-2.5 py-1">
                                  ✓ Assigned
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setAssignProject(project); setAssignSupervisorId(''); }}
                                  className="text-gray-500 hover:text-gray-800 rounded-xl h-9 px-2.5 text-xs font-semibold"
                                >
                                  Reassign
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {coordinatorProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            No project proposals assigned to you yet
                          </TableCell>
                        </TableRow>
                      )}
                      {coordinatorProjects.length > 0 && filteredCoordinatorProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            No projects match the current filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supervised */}
          <TabsContent value="supervised" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">Supervised Academic Projects</CardTitle>
                    <CardDescription className="text-gray-500">Manage and view details of active student teams</CardDescription>
                  </div>
                  <Badge className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] px-3 py-1 rounded-full text-xs w-fit">
                    {hasActiveFilters(supervisedFilters)
                      ? `${filteredSupervisedProjects.length} of ${supervisedProjects.length} Projects`
                      : `${supervisedProjects.length} Active Projects`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {supervisedProjects.length > 0 && (
                  <ProjectFiltersBar
                    filters={supervisedFilters}
                    onChange={setSupervisedFilters}
                    resultCount={filteredSupervisedProjects.length}
                    totalCount={supervisedProjects.length}
                  />
                )}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Project Title</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Student</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Type</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Status</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Start Date</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Progress</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupervisedProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 py-4 px-4 max-w-xs truncate">{project.title}</TableCell>
                          <TableCell className="text-gray-700 py-4 px-4">
                            <div className="space-y-1">
                              <span className="block text-sm">{project.ownerName ?? '—'}{project.ownerIndex ? ` (${project.ownerIndex})` : ''}</span>
                              {(project.groupMembers ?? []).length > 0 && (
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  {(project.groupMembers ?? []).map((m: { indexNumber?: string; email?: string }, i: number) => (
                                    <span key={i} className="block">{m.indexNumber}{m.email ? ` (${m.email})` : ''}</span>
                                  ))}
                                </div>
                              )}
                              <div className="pt-2">
                                <p className="text-xs text-gray-400 italic">Student ratings are available inside the project view.</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 font-semibold rounded-full text-[10px]">
                              {project.project_type === 'group' ? 'Group' : 'Individual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className="bg-blue-50 text-[#1E3A8A] hover:bg-blue-50 border border-blue-100 font-semibold rounded-full text-[10px] uppercase">
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 py-4 px-4 font-mono text-xs">{project.start_date ?? project.submitted_date ?? '—'}</TableCell>
                          <TableCell className="py-4 px-4 min-w-[120px]">
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-gray-800">{project.progress ?? 0}%</span>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#4F46E5] rounded-full"
                                  style={{ width: `${project.progress ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/student/project/${project.id}?view=lecturer`)}
                              className="border-slate-200 text-gray-700 rounded-xl h-9"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {supervisedProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-12">
                            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            No supervised projects yet
                          </TableCell>
                        </TableRow>
                      )}
                      {supervisedProjects.length > 0 && filteredSupervisedProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-12">
                            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            No projects match the current filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review */}
          <TabsContent value="review" className="mt-0 outline-none space-y-8">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Milestone Activity Evaluation</CardTitle>
                <CardDescription className="text-gray-500">Assess and rate activity entries logged by your project teams</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Project</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Activity</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Title</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Logged Period</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Rating</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewProgress.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 py-4 px-4 max-w-[180px] truncate">{entry.projectTitle}</TableCell>
                          <TableCell className="text-gray-700 py-4 px-4">Activity {entry.activity_number}</TableCell>
                          <TableCell className="text-gray-800 font-medium py-4 px-4">{entry.title}</TableCell>
                          <TableCell className="text-gray-500 py-4 px-4 font-mono text-xs">{entry.start_date ?? '—'} to {entry.end_date ?? '—'}</TableCell>
                          <TableCell className="py-4 px-4">
                            {entry.rating ? (
                              <Badge className={ratingBadgeClass(entry.rating)}>{formatRatingLabel(entry.rating)}</Badge>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">Not rated yet</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => { setGradeEntry(entry); setGradeRating(hasNumericRating(entry.rating) ? String(entry.rating) : '5'); }} className="border-slate-200 text-gray-700 font-semibold rounded-xl h-9">
                              <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                              {entry.rating ? 'Re-grade' : 'Grade'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reviewProgress.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-12">No milestone activities logged yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Submitted Documents Review</CardTitle>
                <CardDescription className="text-gray-500">Read and download document uploads, then post feedback</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {reviewDocuments.map((doc) => (
                    <div key={doc.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                            {doc.file_name}
                          </h4>
                          <p className="text-xs text-gray-400">{doc.projectTitle}</p>
                          <p className="text-sm text-gray-600 max-w-xl">{doc.description}</p>
                          <p className="text-xs text-gray-400 font-mono pt-1">Uploaded: {doc.upload_date ?? '—'}</p>
                          {doc.feedback && (
                            <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your feedback:</p>
                              <p className="text-sm text-emerald-700 mt-1">{doc.feedback}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                              <Button size="sm" variant="outline" className="border-slate-200 text-gray-700 rounded-xl h-10 w-full">
                                <Download className="w-4 h-4 mr-1.5" /> Download
                              </Button>
                            </a>
                          )}
                          <Button size="sm" onClick={() => { setFeedbackDoc(doc); setFeedbackText(doc.feedback ?? ''); }} className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl h-10 px-4">
                            <MessageSquare className="w-4 h-4 mr-1.5" /> {doc.feedback ? 'Edit feedback' : 'Add feedback'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviewDocuments.length === 0 && <p className="text-center text-gray-400 py-8">No documents submitted yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>

      {/* Assign Supervisor Dialog */}
      <Dialog open={!!assignProject} onOpenChange={(o) => { if (!o) setAssignProject(null); }}>
        <DialogContent className="border-slate-100 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-950">Assign Supervisor</DialogTitle>
            <DialogDescription className="text-gray-500">Select a supervisor for: <strong className="text-gray-800">{assignProject?.title}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Supervisor (can be yourself)</Label>
              <Select value={assignSupervisorId} onValueChange={setAssignSupervisorId}>
                <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                  <SelectValue placeholder="Select faculty member" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name}{l.id === userId ? ' (You)' : ''} — {l.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignSupervisor} disabled={busy || !assignSupervisorId} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
              {busy ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Progress Dialog */}
      <Dialog open={!!gradeEntry} onOpenChange={(o) => { if (!o) { setGradeEntry(null); setGradeRating('5'); } }}>
        <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-950">Grade Activity</DialogTitle>
            <DialogDescription className="text-gray-500">Rate this milestone from 1 to 10 for: <strong className="text-gray-700">{gradeEntry?.title}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Score (1-10)</Label>
              <Select value={gradeRating} onValueChange={setGradeRating}>
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
            <Button onClick={handleGradeProgress} disabled={busy} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
              {busy ? 'Saving...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Feedback Dialog */}
      <Dialog open={!!feedbackDoc} onOpenChange={(o) => { if (!o) { setFeedbackDoc(null); setFeedbackText(''); } }}>
        <DialogContent className="border-slate-100 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-950">Document Feedback</DialogTitle>
            <DialogDescription className="text-gray-500">Feedback for: <strong className="text-gray-800">{feedbackDoc?.file_name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Type feedback, suggestions, or comments here..." rows={5} className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950 resize-none" />
            <Button onClick={handleSubmitFeedback} disabled={busy || !feedbackText.trim()} className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl">
              {busy ? 'Saving...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
      <p className="font-bold text-gray-900 mt-1">{value || '—'}</p>
    </div>
  );
}
