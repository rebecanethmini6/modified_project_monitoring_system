"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { GraduationCap, LogOut, Plus, FolderOpen, Clock } from 'lucide-react';

type Project = {
  id: string;
  title: string;
  project_type: 'individual' | 'group';
  department: string;
  status: string;
  progress: number;
  supervisorName: string | null;
  coordinatorName: string | null;
  completed_date: string | null;
  submitted_date: string | null;
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Assignment',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    fullName: '',
    indexNumber: '',
    email: '',
    academicYear: '',
    contactNumber: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabaseClient.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.push('/');
        return;
      }

      // Profile
      try {
        const res = await fetch(
          `/api/student/profile?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? '')}`,
        );
        const payload = await res.json();
        if (res.ok && payload?.student) {
          setStudentData(payload.student);
        } else {
          const m = user.user_metadata ?? {};
          setStudentData({
            fullName: m.full_name ?? '',
            indexNumber: m.index_number ?? '',
            email: user.email ?? '',
            academicYear: m.registration_date_label ?? m.registration_date ?? m.academic_year_label ?? m.academic_year ?? '',
            contactNumber: m.contact_number ?? '',
          });
        }
      } catch {
        /* keep blank profile */
      }

      // Projects owned by this student
      try {
        const res = await fetch(`/api/projects?ownerId=${encodeURIComponent(user.id)}`);
        const payload = await res.json();
        if (res.ok && payload?.projects) {
          setProjects(payload.projects);
        }
      } catch {
        /* keep empty */
      }

      setLoading(false);
    };
    void load();
  }, [router]);

  const completedProjects = projects.filter((p) => p.status === 'completed');
  const currentProjects = projects.filter((p) => p.status !== 'completed');

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Project Monitoring System</h1>
              <p className="text-sm text-gray-600">Student Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="completed">Completed Projects</TabsTrigger>
            <TabsTrigger value="current">Current Projects</TabsTrigger>
            <TabsTrigger value="new">Create New Project</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading profile...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{studentData.fullName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Index Number</p>
                      <p className="font-medium">{studentData.indexNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{studentData.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Date</p>
                      <p className="font-medium">{studentData.academicYear || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact Number</p>
                      <p className="font-medium">{studentData.contactNumber || '—'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Completed Projects</h2>
                <Badge variant="secondary">{completedProjects.length} Projects</Badge>
              </div>
              {completedProjects.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">No completed projects yet.</CardContent>
                </Card>
              )}
              {completedProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer" onClick={() => router.push(`/student/project/${project.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {project.department}
                          {project.completed_date ? ` • Completed on ${project.completed_date}` : ''}
                        </CardDescription>
                      </div>
                      <Badge>{project.project_type === 'group' ? 'Group' : 'Individual'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Supervisor: {project.supervisorName ?? 'Not assigned'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="current">
            {currentProjects.length > 0 ? (
              <div className="space-y-4">
                {currentProjects.map((currentProject) => (
                  <Card key={currentProject.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{currentProject.title}</CardTitle>
                          <CardDescription className="mt-2">{currentProject.department}</CardDescription>
                        </div>
                        <Badge variant="default">{statusLabels[currentProject.status] ?? currentProject.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Project Type</p>
                          <p className="font-medium">{currentProject.project_type === 'group' ? 'Group' : 'Individual'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Supervisor</p>
                          <p className="font-medium">{currentProject.supervisorName ?? 'Awaiting assignment'}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-sm font-medium">{currentProject.progress}%</p>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all" style={{ width: `${currentProject.progress}%` }} />
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => router.push(`/student/project/${currentProject.id}`)}>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        View Project Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No active project</p>
                  <Button onClick={() => router.push('/student/project/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="new">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Ready to start a new project?</p>
                <Button onClick={() => router.push('/student/project/new')}>Create New Project</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
