'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, FolderKanban, GraduationCap, LogOut, Search, SlidersHorizontal, UsersRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { getCurrentStudyYear } from '../lib/academic';

const DEPARTMENTS = ['Computer Science', 'Industrial Management', 'Mathematics and Statistics', 'Electronics'] as const;
type Section = 'projects' | 'lecturers' | 'students';
type Project = { id: string; title: string; department?: string | null; status?: string | null; progress?: number | null; submitted_date?: string | null; completed_date?: string | null; supervisorName?: string | null };
type Lecturer = { id: string; lecturer_id?: string | null; full_name?: string | null; email?: string | null; department?: string | null };
type Student = { id: string; fullName?: string | null; indexNumber?: string | null; email?: string | null; registrationDate?: string | null };
type ProjectsResponse = { projects?: Project[] };
type LecturersResponse = { lecturers?: Lecturer[] };
type StudentsResponse = { students?: Student[] };

function department(value?: string | null) {
  const labels: Record<string, string> = { cs: 'Computer Science', 'computer science': 'Computer Science', im: 'Industrial Management', 'industrial management': 'Industrial Management', ms: 'Mathematics and Statistics', 'mathematics and statistics': 'Mathematics and Statistics', ee: 'Electronics', electronics: 'Electronics' };
  return labels[value?.trim().toLowerCase() ?? ''] ?? 'Not specified';
}
function date(value?: string | null) { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(); }
function label(value?: string | null) { return (value ?? 'pending').replace(/_/g, ' '); }
function badgeClass(value?: string | null) { return value === 'completed' ? 'bg-emerald-100 text-emerald-700' : value === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'; }

export function AdminDashboard() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [supervisorFilter, setSupervisorFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lecturerDepartmentFilter, setLecturerDepartmentFilter] = useState('all');
  const [studentStudyYearFilter, setStudentStudyYearFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResponse = await fetch('/api/admin/session');
        if (!sessionResponse.ok) {
          router.replace('/login');
          return;
        }
        const [projectResult, lecturerResult, studentResult] = await Promise.all([fetch('/api/projects'), fetch('/api/lecturers'), fetch('/api/students')]);
        const [projectData, lecturerData, studentData] = await Promise.all([projectResult.json() as Promise<ProjectsResponse>, lecturerResult.json() as Promise<LecturersResponse>, studentResult.json() as Promise<StudentsResponse>]);
        if (!projectResult.ok || !lecturerResult.ok || !studentResult.ok) throw new Error('Some dashboard records could not be loaded.');
        setProjects(projectData.projects ?? []); setLecturers(lecturerData.lecturers ?? []); setStudents(studentData.students ?? []);
      } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Could not load the admin dashboard.'); }
      finally { setLoading(false); }
    };
    void load();
  }, [router]);

  const supervisors = useMemo(() => [...new Set(projects.map((item) => item.supervisorName).filter((item): item is string => Boolean(item)))].sort(), [projects]);
  const filtered = useMemo(() => projects.filter((item) => (supervisorFilter === 'all' || item.supervisorName === supervisorFilter) && (departmentFilter === 'all' || department(item.department) === departmentFilter) && (statusFilter === 'all' || item.status === statusFilter)), [projects, supervisorFilter, departmentFilter, statusFilter]);
  const filteredLecturers = useMemo(() => lecturers.filter((item) => lecturerDepartmentFilter === 'all' || department(item.department) === lecturerDepartmentFilter), [lecturers, lecturerDepartmentFilter]);
  const filteredStudents = useMemo(() => students.filter((item) => studentStudyYearFilter === 'all' || (item.registrationDate && getCurrentStudyYear(item.registrationDate) === studentStudyYearFilter)), [students, studentStudyYearFilter]);
  const activeProjects = projects.filter((item) => item.status !== 'completed').length;
  const logout = async () => { await fetch('/api/admin/session', { method: 'DELETE' }); router.push('/'); };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f7fc] text-slate-600">Loading dashboard...</div>;

  return <div className="min-h-screen bg-[#f7f7fc] text-[#101735] text-lg lg:flex">
    <aside className="hidden min-h-screen w-52 shrink-0 border-r border-[#e5e5f1] bg-white lg:flex lg:flex-col">
      <nav className="space-y-1 p-3"><NavButton active={section === 'projects'} onClick={() => setSection('projects')} icon={<FolderKanban />} label="Projects" /><NavButton active={section === 'lecturers'} onClick={() => setSection('lecturers')} icon={<BookOpenCheck />} label="Lecturers" /><NavButton active={section === 'students'} onClick={() => setSection('students')} icon={<UsersRound />} label="Students" /></nav>
      <button onClick={logout} className="mt-auto flex items-center gap-2 border-t border-[#e5e5f1] px-5 py-5 text-sm font-semibold text-red-600"><LogOut className="h-5 w-5" />Logout</button>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex h-16 items-center justify-between border-b border-[#e5e5f1] bg-white px-5 lg:px-8"><div className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-5 w-5 text-[#052978]" />Project Monitoring System</div><div className="flex items-center gap-4"><div className="hidden items-center gap-2 rounded-full border border-[#e3e4ee] bg-[#fafafe] px-3 py-1.5 text-sm text-slate-400 sm:flex"><Search className="h-4 w-4" />Quick search...</div><span className="rounded-full bg-[#e7edff] px-3 py-1.5 text-sm font-bold text-[#082c7e]">AD</span><span className="hidden text-sm font-semibold sm:block">Admin User</span></div></header>
      <main className="w-full p-5 lg:p-8">
        {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-base text-red-700">{error}</div>}
        <section className="rounded-xl bg-[#072c7c] px-6 py-7 text-white shadow-md lg:px-8"><h1 className="text-3xl font-extrabold">{section === 'projects' ? 'Executive Overview' : section === 'lecturers' ? 'Lecturer Directory' : 'Student Directory'}</h1><p className="mt-2 text-sm text-blue-200">Real-time surveillance of academic progression and research integrity.</p></section>
        <section className="mt-5 grid gap-3 sm:grid-cols-3"><Summary icon={<FolderKanban />} title="All Projects" value={projects.length} note={`${activeProjects} Active Projects`} tone="blue" /><Summary icon={<BookOpenCheck />} title="Registered Lecturers" value={lecturers.length} note="Available for supervision" tone="indigo" /><Summary icon={<UsersRound />} title="Registered Students" value={students.length} note="Registered accounts" tone="orange" /></section>
        {section === 'projects' && <><section className="mt-5 grid gap-4 rounded-lg border border-[#e0e1eb] bg-[#f0f0f6] p-4 md:grid-cols-4"><SelectFilter label="Department" value={departmentFilter} setValue={setDepartmentFilter}><option value="all">All Departments</option>{DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</SelectFilter><SelectFilter label="Status" value={statusFilter} setValue={setStatusFilter}><option value="all">Any Status</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></SelectFilter><SelectFilter label="Lecturer" value={supervisorFilter} setValue={setSupervisorFilter}><option value="all">All Supervisors</option>{supervisors.map((item) => <option key={item} value={item}>{item}</option>)}</SelectFilter><div className="flex items-end"><Button className="h-10 w-full bg-[#082d7c] text-sm hover:bg-[#062365]"><SlidersHorizontal className="mr-2 h-4 w-4" />Apply Filters</Button></div></section><section className="mt-5 overflow-hidden rounded-lg border border-[#e2e3ec] bg-white"><div className="flex items-center justify-between border-b border-[#ececf3] px-5 py-4"><h2 className="text-base font-extrabold">Happening Projects</h2><button className="text-xs font-semibold text-[#082d7c]">Export as CSV</button></div><ProjectTable projects={filtered} /></section></>}
        {section === 'lecturers' && <section className="mt-5 overflow-hidden rounded-lg border border-[#e2e3ec] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf3] px-5 py-4"><h2 className="text-base font-extrabold">All Registered Lecturers</h2><label className="flex items-center gap-2 text-sm font-medium text-slate-600">Department <select value={lecturerDepartmentFilter} onChange={(event) => setLecturerDepartmentFilter(event.target.value)} className="h-10 rounded-md border border-[#dde0ea] bg-white px-2 text-sm text-slate-700"><option value="all">All Departments</option>{DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><LecturerTable lecturers={filteredLecturers} /></section>}
        {section === 'students' && <section className="mt-5 overflow-hidden rounded-lg border border-[#e2e3ec] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf3] px-5 py-4"><h2 className="text-base font-extrabold">All Registered Students</h2><label className="flex items-center gap-2 text-sm font-medium text-slate-600">Study Year <select value={studentStudyYearFilter} onChange={(event) => setStudentStudyYearFilter(event.target.value)} className="h-10 rounded-md border border-[#dde0ea] bg-white px-2 text-sm text-slate-700"><option value="all">All Years</option><option value="First Year">First Year</option><option value="Second Year">Second Year</option><option value="Third Year">Third Year</option><option value="Fourth Year">Fourth Year</option><option value="Graduate">Graduate</option></select></label></div><StudentTable students={filteredStudents} /></section>}
      </main>
    </div>
  </div>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold ${active ? 'bg-[#082d7c] text-white shadow-sm' : 'text-slate-600 hover:bg-[#f0f2fa]'}`}><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</button>; }
function Summary({ icon, title, value, note, tone }: { icon: React.ReactNode; title: string; value: number; note: string; tone: 'blue' | 'indigo' | 'orange' }) { const colors = { blue: 'bg-[#dce8ff] text-[#174a9f]', indigo: 'bg-[#e4e8ff] text-[#384aaf]', orange: 'bg-[#ffe8da] text-[#be6038]' }; return <Card className="border-[#e2e3ec] shadow-none"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-1 text-3xl font-extrabold">{value.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div><span className={`rounded-full p-3 ${colors[tone]} [&>svg]:h-6 [&>svg]:w-6`}>{icon}</span></CardContent></Card>; }
function SelectFilter({ label, value, setValue, children }: { label: string; value: string; setValue: (value: string) => void; children: React.ReactNode }) { return <label className="text-xs font-medium text-slate-500">{label}<select value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-[#dde0ea] bg-white px-3 text-sm text-slate-700">{children}</select></label>; }
function ProjectTable({ projects }: { projects: Project[] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#fafaff] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Project Name</th><th>Department</th><th>Supervisor</th><th>Status</th><th>Progress</th><th>Date</th></tr></thead><tbody>{projects.map((item) => <tr key={item.id} className="border-t border-[#f0f0f5] text-sm"><td className="px-5 py-4 font-bold text-[#152044]"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded bg-[#e1eafe] text-xs text-[#082d7c]">P</span>{item.title}</td><td className="text-slate-600">{department(item.department)}</td><td className="text-slate-600">{item.supervisorName ?? 'Not assigned'}</td><td><span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${badgeClass(item.status)}`}>{label(item.status)}</span></td><td><div className="font-semibold text-[#082d7c]">{item.progress ?? 0}% Complete</div><div className="mt-1 h-1.5 w-16 rounded bg-slate-100"><div className="h-full rounded bg-[#082d7c]" style={{ width: `${Math.min(100, Math.max(0, item.progress ?? 0))}%` }} /></div></td><td className="text-slate-600">{date(item.completed_date ?? item.submitted_date)}</td></tr>)}{projects.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-base text-slate-500">No projects match these filters.</td></tr>}</tbody></table></div>; }
function LecturerTable({ lecturers }: { lecturers: Lecturer[] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#fafaff] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Lecturer</th><th>Lecturer ID</th><th>Email</th><th>Department</th></tr></thead><tbody>{lecturers.map((item) => <tr key={item.id} className="border-t border-[#f0f0f5]"><td className="px-5 py-4 font-bold">{item.full_name ?? '—'}</td><td>{item.lecturer_id ?? '—'}</td><td>{item.email ?? '—'}</td><td>{department(item.department)}</td></tr>)}</tbody></table></div>; }
function StudentTable({ students }: { students: Student[] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#fafaff] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Student</th><th>Index Number</th><th>Email</th><th>Study Year</th></tr></thead><tbody>{students.map((item) => <tr key={item.id} className="border-t border-[#f0f0f5]"><td className="px-5 py-4 font-bold">{item.fullName ?? '—'}</td><td>{item.indexNumber ?? '—'}</td><td>{item.email ?? '—'}</td><td>{item.registrationDate ? getCurrentStudyYear(item.registrationDate) : '—'}</td></tr>)}</tbody></table></div>; }
