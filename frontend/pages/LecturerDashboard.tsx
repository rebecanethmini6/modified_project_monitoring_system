"use client";
import { useEffect, useState } from 'react';
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
import { 
  GraduationCap, 
  LogOut, 
  UserCheck, 
  ClipboardList, 
  Star, 
  MessageSquare, 
  Eye, 
  Menu, 
  Bell, 
  User, 
  Users, 
  ClipboardCheck, 
  CalendarRange, 
  Award, 
  Search,
  BookOpen,
  FolderOpen
} from 'lucide-react';

const departmentLabels: Record<string, string> = {
  cs: 'Computer Science',
  it: 'Information Technology',
  se: 'Software Engineering',
  ds: 'Data Science',
  math: 'Mathematics',
};

export function LecturerDashboard() {
  const router = useRouter();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProgress, setSelectedProgress] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lecturerData, setLecturerData] = useState({
    lecturerId: '',
    fullName: '',
    email: '',
    department: '',
    contactNumber: '',
    role: '',
  });

  useEffect(() => {
    const loadLecturer = async () => {
      const { data } = await supabaseClient.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/lecturer/profile?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? '')}`);
      const payload = await response.json();

      if (response.ok && payload?.lecturer) {
        setLecturerData(payload.lecturer);
      } else {
        const metadata = user.user_metadata ?? {};
        setLecturerData({
          lecturerId: metadata.lecturer_id ?? '',
          fullName: metadata.full_name ?? '',
          email: user.email ?? '',
          department: metadata.department_label ?? departmentLabels[metadata.department] ?? metadata.department ?? '',
          contactNumber: metadata.contact_number ?? '',
          role: metadata.role ?? '',
        });
      }
      setLoading(false);
    };

    void loadLecturer();
  }, [router]);

  // Mock pending projects (for coordinator)
  const [pendingProjects, setPendingProjects] = useState([
    {
      id: 1,
      title: 'AI-Powered Chatbot for Customer Service',
      student: 'Alice Johnson (2021/CS/004)',
      department: 'Computer Science',
      type: 'Individual',
      submittedDate: '2026-05-01',
      supervisor: null,
    },
    {
      id: 2,
      title: 'Blockchain-based Voting System',
      student: 'Bob Smith (2021/CS/005)',
      department: 'Computer Science',
      type: 'Group',
      submittedDate: '2026-05-03',
      supervisor: null,
    },
  ]);

  // Mock supervised projects
  const supervisedProjects = [
    {
      id: 3,
      title: 'University Project Monitoring System',
      students: ['John Doe (2021/CS/001)', 'Jane Wilson (2021/CS/002)'],
      type: 'Group',
      status: 'In Progress',
      progress: 65,
      startDate: '2026-01-15',
    },
    {
      id: 4,
      title: 'Mobile App for Campus Navigation',
      students: ['Mark Brown (2021/CS/006)'],
      type: 'Individual',
      status: 'In Progress',
      progress: 40,
      startDate: '2026-02-01',
    },
  ];

  // Mock progress entries for supervised projects
  const projectProgress: Record<number, any[]> = {
    3: [
      {
        id: 1,
        activityNumber: 1,
        title: 'Requirements Gathering',
        description: 'Collected and documented all system requirements',
        startDate: '2026-01-15',
        endDate: '2026-01-30',
        nextSteps: 'Begin database design',
        rating: 'Excellent',
      },
      {
        id: 2,
        activityNumber: 2,
        title: 'Database Design',
        description: 'Designed relational schema and ER diagrams',
        startDate: '2026-02-01',
        endDate: '2026-02-15',
        nextSteps: 'Implement backend API',
        rating: '',
      },
    ],
  };

  // Mock documents for supervised projects
  const projectDocuments: Record<number, any[]> = {
    3: [
      {
        id: 1,
        name: 'Project Proposal.pdf',
        description: 'Initial project proposal document',
        uploadDate: '2026-01-10',
        feedback: '',
      },
      {
        id: 2,
        name: 'Requirements Document.docx',
        description: 'Complete system requirements specification',
        uploadDate: '2026-01-30',
        feedback: '',
      },
    ],
  };

  const handleAssignSupervisor = (projectId: number, supervisorId: string) => {
    setPendingProjects(pendingProjects.filter(p => p.id !== projectId));
    setShowAssignDialog(false);
    alert('Supervisor assigned successfully!');
  };

  const handleRateProgress = (rating: string) => {
    alert(`Progress rated as: ${rating}`);
    setShowRatingDialog(false);
  };

  const handleSubmitFeedback = (feedback: string) => {
    alert('Feedback submitted successfully!');
    setShowFeedbackDialog(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-500 hover:bg-slate-50"
          >
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
          {/* Mock notification icon */}
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-slate-50">
            <Bell className="w-5 h-5" />
            {pendingProjects.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="border-slate-200 text-gray-700 hover:bg-slate-50 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row flex-1">
        {/* Left sidebar layout */}
        <aside className={`bg-white border-r border-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col justify-between flex-shrink-0`}>
          <div>
            {/* Lecturer quick info */}
            <div className={`p-4 border-b border-slate-50 flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] font-bold flex items-center justify-center flex-shrink-0">
                {lecturerData.fullName ? lecturerData.fullName[0].toUpperCase() : 'L'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{lecturerData.fullName || 'Faculty Member'}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lecturerData.role || 'Lecturer'}</p>
                </div>
              )}
            </div>

            {/* Sidebar navigation list */}
            <TabsList className="flex flex-col h-auto bg-transparent border-0 space-y-1 p-3">
              <TabsTrigger 
                value="profile" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Faculty Profile</span>}
              </TabsTrigger>

              <TabsTrigger 
                value="coordinator" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <ClipboardList className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>Coordinator Projects</span>
                    {pendingProjects.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-semibold px-2 py-0.5 text-[10px] rounded-full">
                        {pendingProjects.length}
                      </Badge>
                    )}
                  </div>
                )}
              </TabsTrigger>

              <TabsTrigger 
                value="supervised" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Supervised Projects</span>}
              </TabsTrigger>

              <TabsTrigger 
                value="review" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
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

        {/* Main Workspace Panel */}
        <main className="flex-1 p-6 md:p-8 bg-[#F8FAFC] overflow-y-auto">
          {/* Welcome Lecturer Banner */}
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#4F46E5] text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-blue-900/5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome, {lecturerData.fullName || 'Faculty Member'}
              </h2>
              <p className="text-blue-100 text-sm md:text-base font-medium max-w-lg">
                Manage student project registrations, evaluate milestones, and provide constructive academic feedbacks.
              </p>
            </div>
            <div className="flex gap-4 relative z-10 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Department</span>
                <span className="text-sm font-bold">{lecturerData.department || 'Faculty'}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Role Type</span>
                <span className="text-sm font-bold">{lecturerData.role || 'Lecturer'}</span>
              </div>
            </div>
          </div>

          {/* Profile Tab Contents */}
          <TabsContent value="profile" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-gray-900">Faculty Member Profile</CardTitle>
                <CardDescription className="text-gray-500">Your professional university details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <svg className="animate-spin h-8 w-8 text-[#1E3A8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading faculty workspace profile...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lecturer ID</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.lecturerId}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Full Name</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.fullName}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.email}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Department</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.department}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Contact Number</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.contactNumber}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Faculty Role</p>
                      <p className="font-bold text-gray-900 mt-1">{lecturerData.role}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coordinator Tab Contents */}
          <TabsContent value="coordinator" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Pending Project Assignments</CardTitle>
                <CardDescription className="text-gray-500">
                  Assign academic supervisors to student project proposals
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Project Title</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Student Name</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Type</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Submitted Date</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 py-4 px-4 max-w-xs truncate">{project.title}</TableCell>
                          <TableCell className="text-gray-700 py-4 px-4">{project.student}</TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 font-semibold rounded-full text-[10px]">
                              {project.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 py-4 px-4 font-mono text-xs">{project.submittedDate}</TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            <Dialog
                              open={showAssignDialog && selectedProject?.id === project.id}
                              onOpenChange={(open) => {
                                setShowAssignDialog(open);
                                if (open) setSelectedProject(project);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl px-3.5 h-9">
                                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                  Assign Supervisor
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="border-slate-100 rounded-2xl max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-lg font-bold text-gray-950">Assign Supervisor</DialogTitle>
                                  <DialogDescription className="text-gray-500">
                                    Select an academic supervisor for: <strong className="text-gray-800">{project.title}</strong>
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Supervisor Name</Label>
                                    <Select>
                                      <SelectTrigger className="h-11 border-slate-200 focus:ring-[#1E3A8A] rounded-xl text-gray-950">
                                        <SelectValue placeholder="Select faculty member" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="lec001">Dr. Emily Williams</SelectItem>
                                        <SelectItem value="lec002">Dr. Michael Chen</SelectItem>
                                        <SelectItem value="lec003">Dr. Sarah Johnson</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={() => handleAssignSupervisor(project.id, 'lec001')}
                                    className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl"
                                  >
                                    Confirm Assignment
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-400 py-12">
                            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            No pending project assignments
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supervised Tab Contents */}
          <TabsContent value="supervised" className="mt-0 outline-none space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Supervised Academic Projects</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage and view details of active student teams</p>
              </div>
              <Badge className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] px-3 py-1 rounded-full text-xs">
                {supervisedProjects.length} Active Projects
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supervisedProjects.map((project) => (
                <Card key={project.id} className="border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 rounded-2xl flex flex-col justify-between">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Badge className="bg-blue-50 text-[#1E3A8A] hover:bg-blue-50 border border-blue-100 font-semibold rounded-full text-[10px] uppercase">
                          {project.status}
                        </Badge>
                        <CardTitle className="text-base font-bold text-gray-900 pt-1 leading-snug">{project.title}</CardTitle>
                      </div>
                      <Badge className="bg-indigo-50 text-[#4F46E5] hover:bg-indigo-50 border border-indigo-100 font-semibold rounded-full text-[10px]">
                        {project.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-5">
                    <div className="border-t border-slate-50 pt-4 space-y-2.5">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Students</span>
                        <div className="flex flex-col gap-1 mt-1">
                          {project.students.map((stud, idx) => (
                            <span key={idx} className="text-xs font-semibold text-gray-700">{stud}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                        <div>
                          <span className="text-gray-400">Start Date</span>
                          <span className="block font-semibold text-gray-800 mt-0.5">{project.startDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Milestone Progress</span>
                          <span className="block font-semibold text-gray-800 mt-0.5">{project.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#4F46E5] transition-all duration-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full h-10 border-slate-200 hover:bg-slate-50 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2"
                      variant="outline"
                      onClick={() => router.push(`/student/project/${project.id}?view=lecturer`)}
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Review Tab Contents */}
          <TabsContent value="review" className="mt-0 outline-none space-y-8">
            {/* 1. Progress Evaluation Table */}
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Milestone Activity Evaluation</CardTitle>
                <CardDescription className="text-gray-500">
                  Assess and rate latest activity entries logged by student project teams
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table className="min-w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Project Name</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Activity</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Title</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Logged Period</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4">Rating Status</TableHead>
                        <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider py-3.5 px-4 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectProgress[3]?.map((progress) => (
                        <TableRow key={progress.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 py-4 px-4 max-w-[180px] truncate">University Project...</TableCell>
                          <TableCell className="text-gray-700 py-4 px-4">Activity {progress.activityNumber}</TableCell>
                          <TableCell className="text-gray-800 font-medium py-4 px-4">{progress.title}</TableCell>
                          <TableCell className="text-gray-500 py-4 px-4 font-mono text-xs">
                            {progress.startDate} to {progress.endDate}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {progress.rating ? (
                              <Badge
                                className={
                                  progress.rating === 'Excellent'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 font-semibold rounded-full text-[10px]'
                                    : progress.rating === 'Good'
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100 font-semibold rounded-full text-[10px]'
                                    : 'bg-red-50 text-red-700 hover:bg-red-50 border border-red-100 font-semibold rounded-full text-[10px]'
                                }
                              >
                                {progress.rating}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-medium">Not rated yet</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            {!progress.rating ? (
                              <Dialog
                                open={showRatingDialog && selectedProgress?.id === progress.id}
                                onOpenChange={(open) => {
                                  setShowRatingDialog(open);
                                  if (open) setSelectedProgress(progress);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="border-slate-200 text-gray-700 font-semibold rounded-xl h-9 hover:bg-slate-55">
                                    <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                                    Grade Activity
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-slate-100 rounded-2xl max-w-sm">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-bold text-gray-950">Grade Activity</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                      Select an evaluation score for: <strong className="text-gray-700">{progress.title}</strong>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 pt-4">
                                    <Button
                                      onClick={() => handleRateProgress('Excellent')}
                                      className="w-full h-11 bg-emerald-55 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl"
                                      variant="ghost"
                                    >
                                      Excellent (High Quality)
                                    </Button>
                                    <Button
                                      onClick={() => handleRateProgress('Good')}
                                      className="w-full h-11 bg-blue-55 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl"
                                      variant="ghost"
                                    >
                                      Good (Meets Standards)
                                    </Button>
                                    <Button
                                      onClick={() => handleRateProgress('Bad')}
                                      className="w-full h-11 bg-red-55 hover:bg-red-100 text-red-800 border border-red-200 font-bold rounded-xl"
                                      variant="ghost"
                                    >
                                      Bad (Revision Required)
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-xs text-emerald-600 font-semibold">Grades recorded</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 2. Document Review Feedback */}
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-bold text-gray-900">Submitted Documents Review</CardTitle>
                <CardDescription className="text-gray-500">
                  Read research proposals and requirements document uploads to post annotations and feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {projectDocuments[3]?.map((doc) => (
                    <div key={doc.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                            {doc.name}
                          </h4>
                          <p className="text-sm text-gray-600 max-w-xl">{doc.description}</p>
                          <p className="text-xs text-gray-400 font-mono pt-1">
                            Uploaded Date: {doc.uploadDate}
                          </p>
                          
                          {doc.feedback && (
                            <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                Faculty feedback notes:
                              </p>
                              <p className="text-sm text-emerald-700 mt-1">{doc.feedback}</p>
                            </div>
                          )}
                        </div>

                        {!doc.feedback && (
                          <Dialog
                            open={showFeedbackDialog && selectedDocument?.id === doc.id}
                            onOpenChange={(open) => {
                              setShowFeedbackDialog(open);
                              if (open) setSelectedDocument(doc);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl self-start md:self-auto h-10 px-4">
                                <MessageSquare className="w-4 h-4 mr-1.5" />
                                Add feedback
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="border-slate-100 rounded-2xl max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-gray-950">Add Feedback Notes</DialogTitle>
                                <DialogDescription className="text-gray-500">
                                  Provide annotations and guidelines for: <strong className="text-gray-800">{doc.name}</strong>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Textarea
                                  placeholder="Type feedback, suggestions, or comments here..."
                                  rows={5}
                                  className="border-slate-200 focus-visible:ring-[#1E3A8A] rounded-xl text-gray-950 resize-none"
                                />
                                <Button
                                  onClick={() => handleSubmitFeedback('Great work!')}
                                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl"
                                >
                                  Submit Feedback Notes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}