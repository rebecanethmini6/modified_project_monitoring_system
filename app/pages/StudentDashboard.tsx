"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '@/frontend/lib/supabaseClient';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { Badge } from '@/frontend/components/ui/badge';
import { getAcademicBatch, getCurrentAcademicYear, getCurrentStudyYear, normalizeRegistrationDate } from '@/frontend/lib/academic';
import { 
  GraduationCap, 
  LogOut, 
  Plus, 
  FolderOpen, 
  Clock, 
  User, 
  CheckCircle2, 
  Layers, 
  PlusCircle, 
  Menu, 
  Bell, 
  TrendingUp, 
  MessageSquare, 
  CalendarRange, 
  ArrowRight,
  BookOpen,
  ChevronRight
} from 'lucide-react';

type StudentProject = {
  id: string;
  title: string;
  project_type?: string;
  department?: string;
  supervisorName?: string;
  status?: string;
  progress?: number;
  completed_date?: string;
  start_date?: string;
  submitted_date?: string;
  owner_id?: string;
};

export function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentData, setStudentData] = useState({
    fullName: '',
    indexNumber: '',
    email: '',
  registrationDate: '',
  admissionBatch: '',
  currentAcademicYear: '',
  currentStudyYear: '',
    contactNumber: '',
  });
  const [userId, setUserId] = useState('');
  const [allProjects, setAllProjects] = useState<StudentProject[]>([]);
  const [projectLoading, setProjectLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      const { data } = await supabaseClient.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push('/');
        return;
      }
      setUserId(user.id);

      // Fetch profile
      const response = await fetch(`/api/student/profile?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? '')}`);
      const payload = await response.json();

      if (response.ok && payload?.student) {
        setStudentData(payload.student);
      } else {
        const metadata = user.user_metadata ?? {};
        const registrationDate = normalizeRegistrationDate(metadata.registration_date ?? metadata.academic_year);
        setStudentData({
          fullName: metadata.full_name ?? '',
          indexNumber: metadata.index_number ?? '',
          email: user.email ?? '',
          registrationDate,
          admissionBatch: registrationDate ? getAcademicBatch(registrationDate) : '',
          currentAcademicYear: registrationDate ? getCurrentAcademicYear() : '',
          currentStudyYear: registrationDate ? getCurrentStudyYear(registrationDate) : '',
          contactNumber: metadata.contact_number ?? '',
        });
      }

      // Load every project this student is enrolled in (owned individual/group
      // projects AND group projects where they are listed as a member).
      try {
        const projResponse = await fetch(`/api/projects?enrolledStudentId=${encodeURIComponent(user.id)}`);
        const projPayload = await projResponse.json();
        if (projResponse.ok && projPayload?.projects) {
          setAllProjects(projPayload.projects);
        }
      } catch (projErr) {
        console.error('Failed to load projects:', projErr);
      } finally {
        setProjectLoading(false);
      }

      setLoading(false);
    };

    void loadStudent();
  }, [router]);

  // Real completed projects for this student
  const completedProjects = allProjects
    .filter((p) => p.status === 'completed')
    .map((p) => ({
      id: p.id,
      title: p.title,
      type: p.project_type === 'group' ? 'Group' : 'Individual',
      department: p.department,
      supervisor: p.supervisorName || 'Not Assigned',
      completedDate: p.completed_date || '—',
    }));

  // All active (non-completed) enrolled projects.
  const currentProjects = allProjects
    .filter((p) => p.status !== 'completed')
    .map((p) => ({
      id: p.id,
      title: p.title,
      type: p.project_type === 'group' ? 'Group' : 'Individual',
      department: p.department,
      supervisor: p.supervisorName || 'Not Assigned',
      status: p.status === 'pending' ? 'Pending Approval' : 'In Progress',
      progress: p.progress || 0,
      startDate: p.start_date || p.submitted_date || '—',
      isOwner: p.owner_id === userId,
    }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
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
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">University Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
        {/* Left Sidebar */}
        <aside className={`bg-white border-r border-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col justify-between flex-shrink-0`}>
          <div>
            {/* Student profile quick glance */}
            <div className={`p-4 border-b border-slate-50 flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] font-bold flex items-center justify-center flex-shrink-0">
                {studentData.fullName ? studentData.fullName[0].toUpperCase() : 'S'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{studentData.fullName || 'Student Name'}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{studentData.indexNumber || 'Index No.'}</p>
                </div>
              )}
            </div>

            {/* Sidebar Tab List */}
            <TabsList className="flex flex-col h-auto bg-transparent border-0 space-y-1 p-3">
              <TabsTrigger 
                value="profile" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Student Profile</span>}
              </TabsTrigger>

              <TabsTrigger 
                value="current" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <Layers className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Current Project</span>}
              </TabsTrigger>

              <TabsTrigger 
                value="completed" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Completed Projects</span>}
              </TabsTrigger>

              <TabsTrigger 
                value="new" 
                className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium hover:bg-slate-50 text-gray-600 transition-all duration-150 data-[state=active]:bg-blue-50 data-[state=active]:text-[#1E3A8A]"
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>New Project Request</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-slate-50 text-center">
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider">v1.2.0 • ACADEMIC YEAR 2026</span>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 bg-[#F8FAFC] overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#4F46E5] text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-blue-900/5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {studentData.fullName.split(' ')[0] || 'Student'}!
              </h2>
              <p className="text-blue-100 text-sm md:text-base font-medium max-w-lg">
                Manage your academic submissions, review feedback, and keep track of project milestones.
              </p>
            </div>
            <div className="flex gap-4 relative z-10 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Study Year</span>
                <span className="text-sm font-bold">{studentData.currentStudyYear || 'Not set'}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[100px]">
                <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Index No</span>
                <span className="text-sm font-bold">{studentData.indexNumber || '-'}</span>
              </div>
            </div>
          </div>

          {/* Tab Content Wrappers */}
          <TabsContent value="profile" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg font-bold text-gray-900">Student Profile</CardTitle>
                <CardDescription className="text-gray-500">Your registered university credentials</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <svg className="animate-spin h-8 w-8 text-[#1E3A8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">Loading workspace profile...</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">Field</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Full Name</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.fullName}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Index Number</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.indexNumber}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Email Address</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.email}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Registration Date</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.registrationDate}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Admission Batch</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.admissionBatch}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Current Academic Year</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.currentAcademicYear}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Current Study Year</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.currentStudyYear}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">Contact Number</td>
                          <td className="px-5 py-4 font-bold text-gray-900">{studentData.contactNumber}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-0 outline-none space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Completed Projects</h2>
                <p className="text-xs text-gray-500 mt-0.5">Archive of completed academic modules</p>
              </div>
              <Badge className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] px-3 py-1 text-xs rounded-full">
                {completedProjects.length} Projects
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedProjects.map((project) => (
                <Card key={project.id} className="border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 rounded-2xl flex flex-col justify-between">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 font-semibold rounded-full text-[10px]">
                          Completed
                        </Badge>
                        <CardTitle className="text-base font-bold text-gray-900 pt-1 leading-snug">{project.title}</CardTitle>
                      </div>
                      <Badge className="bg-indigo-50 text-[#4F46E5] border border-indigo-100 hover:bg-indigo-50 font-semibold rounded-full text-[10px]">
                        {project.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="border-t border-slate-50 pt-4 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Department</span>
                        <span className="font-semibold text-gray-800">{project.department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Supervisor</span>
                        <span className="font-semibold text-gray-800">{project.supervisor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Completed Date</span>
                        <span className="font-semibold text-gray-800">{project.completedDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="current" className="mt-0 outline-none">
            {projectLoading ? (
              <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                  <svg className="animate-spin h-8 w-8 text-[#1E3A8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">Checking active projects...</p>
                </CardContent>
              </Card>
            ) : currentProjects.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">My Enrolled Projects</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Projects you own or are a group member of</p>
                  </div>
                  <Badge className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] px-3 py-1 rounded-full text-xs">
                    {currentProjects.length} Active
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Project Title</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Supervisor</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Progress</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentProjects.map((currentProject) => (
                        <tr key={currentProject.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-900 leading-tight">{currentProject.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{currentProject.department}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className="bg-indigo-50 text-[#4F46E5] hover:bg-indigo-50 border border-indigo-100 font-semibold rounded-full text-[10px]">
                              {currentProject.type}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className="bg-blue-50 text-[#1E3A8A] hover:bg-blue-50 border border-blue-100 font-semibold rounded-full text-[10px] uppercase">
                              {currentProject.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={`font-semibold rounded-full text-[10px] border ${currentProject.isOwner ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              {currentProject.isOwner ? 'Owner' : 'Group Member'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-gray-700 font-medium">{currentProject.supervisor}</td>
                          <td className="px-5 py-4 text-gray-700 font-medium whitespace-nowrap">{currentProject.startDate}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#4F46E5] transition-all duration-500 rounded-full"
                                  style={{ width: `${currentProject.progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-extrabold text-[#1E3A8A] w-8 text-right">{currentProject.progress}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Button
                              size="sm"
                              className="bg-[#1E3A8A] hover:bg-[#152a63] text-white font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap"
                              onClick={() => router.push(`/student/project/${currentProject.id}`)}
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              View
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                    <Clock className="w-12 h-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">No Active Project</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      You are not currently registered to any active research project. Submit a request to get started.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/student/project/new')}
                    className="bg-[#1E3A8A] hover:bg-[#152a63] text-white rounded-xl h-11 font-semibold px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Project Proposal
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-0 outline-none">
            <Card className="border-slate-100 shadow-xl shadow-slate-100/50 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-5">
                <div className="bg-blue-50 text-[#1E3A8A] p-4 rounded-3xl">
                  <BookOpen className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-950">Ready to start a new project?</h3>
                  <p className="text-sm text-gray-500 max-w-md mt-1 leading-relaxed">
                    Submit your details, objectives, and project description. Once submitted, the coordinator will review the requirements and assign a supervisor.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/student/project/new')}
                  className="bg-[#1E3A8A] hover:bg-[#152a63] text-white rounded-xl h-11 font-semibold px-6 flex items-center gap-1.5"
                >
                  Create New Project Request <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
