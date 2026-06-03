"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { GraduationCap, LogOut, Plus, FolderOpen, Clock } from 'lucide-react';

export function StudentDashboard() {
  const router = useRouter();

  // Mock student data
  const studentData = {
    fullName: 'John Doe',
    indexNumber: '2021/CS/001',
    email: 'john.doe@university.edu',
    combination: 'Computer Science',
    academicYear: 'Year 3',
    contactNumber: '+94 77 123 4567',
  };

  // Mock projects data
  const completedProjects = [
    {
      id: 1,
      title: 'E-Commerce Web Application',
      type: 'Individual',
      department: 'Computer Science',
      supervisor: 'Dr. Sarah Johnson',
      completedDate: '2025-12-15',
    },
    {
      id: 2,
      title: 'Machine Learning Image Classifier',
      type: 'Group',
      department: 'Computer Science',
      supervisor: 'Dr. Michael Chen',
      completedDate: '2024-11-20',
    },
  ];

  const currentProject = {
    id: 3,
    title: 'University Project Monitoring System',
    type: 'Group',
    department: 'Computer Science',
    supervisor: 'Dr. Emily Williams',
    status: 'In Progress',
    progress: 65,
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
          <Button variant="outline" onClick={() => router.push('/')}>
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
            <TabsTrigger value="current">Current Project</TabsTrigger>
            <TabsTrigger value="new">Create New Project</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{studentData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Index Number</p>
                    <p className="font-medium">{studentData.indexNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{studentData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Combination</p>
                    <p className="font-medium">{studentData.combination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Academic Year</p>
                    <p className="font-medium">{studentData.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-medium">{studentData.contactNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Completed Projects</h2>
                <Badge variant="secondary">
                  {completedProjects.length} Projects
                </Badge>
              </div>
              {completedProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {project.department} • Completed on {project.completedDate}
                        </CardDescription>
                      </div>
                      <Badge>{project.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Supervisor: {project.supervisor}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="current">
            {currentProject ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{currentProject.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {currentProject.department}
                      </CardDescription>
                    </div>
                    <Badge variant="default">{currentProject.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Project Type</p>
                      <p className="font-medium">{currentProject.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supervisor</p>
                      <p className="font-medium">{currentProject.supervisor}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-sm font-medium">{currentProject.progress}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${currentProject.progress}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/student/project/${currentProject.id}`)}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Project Details
                  </Button>
                </CardContent>
              </Card>
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
                <Button onClick={() => router.push('/student/project/new')}>
                  Create New Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}