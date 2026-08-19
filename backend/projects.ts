import type { SupabaseClient } from '@supabase/supabase-js';

const METADATA_SEPARATOR = '\n\n===METADATA===\n';

export type GroupMember = { indexNumber: string; email: string };
export type ProjectStudent = {
  key: string;
  name: string | null;
  indexNumber: string | null;
  email: string | null;
  role: 'owner' | 'member';
};

/**
 * Group members are serialized into the project description on creation.
 * This splits the human-readable description from that JSON metadata.
 */
export function parseDescription(rawDescription: string | null): {
  description: string;
  groupMembers: GroupMember[];
} {
  const value = rawDescription ?? '';
  const parts = value.split(METADATA_SEPARATOR);
  if (parts.length < 2) {
    return { description: value, groupMembers: [] };
  }
  try {
    const meta = JSON.parse(parts[1]);
    return { description: parts[0], groupMembers: meta.groupMembers ?? [] };
  } catch {
    return { description: parts[0], groupMembers: [] };
  }
}

/**
 * Attach owner (student), supervisor and coordinator display names to a set of
 * projects using batched lookups (no N+1). Also splits out group members.
 */
export async function enrichProjects(
  supabase: SupabaseClient,
  projects: Array<Record<string, any>>,
) {
  const studentIds = new Set<string>();
  const lecturerIds = new Set<string>();
  for (const p of projects) {
    if (p.owner_id) studentIds.add(p.owner_id);
    if (p.supervisor_id) lecturerIds.add(p.supervisor_id);
    if (p.coordinator_id) lecturerIds.add(p.coordinator_id);
  }

  const studentMap = new Map<string, { full_name: string; index_number: string; email: string; registration_date: string }>();
  if (studentIds.size > 0) {
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name, index_number, email, registration_date')
      .in('id', Array.from(studentIds));
    for (const s of students ?? []) studentMap.set(s.id, s);
  }

  const lecturerMap = new Map<string, { full_name: string; email: string; department: string }>();
  if (lecturerIds.size > 0) {
    const { data: lecturers } = await supabase
      .from('lecturers')
      .select('id, full_name, email, department')
      .in('id', Array.from(lecturerIds));
    for (const l of lecturers ?? []) lecturerMap.set(l.id, l);
  }

  return projects.map((p) => enrichOne(p, studentMap, lecturerMap));
}

function enrichOne(
  p: Record<string, any>,
  studentMap: Map<string, any>,
  lecturerMap: Map<string, any>,
) {
  const { description, groupMembers } = parseDescription(p.description);
  const owner = p.owner_id ? studentMap.get(p.owner_id) : undefined;
  const supervisor = p.supervisor_id ? lecturerMap.get(p.supervisor_id) : undefined;
  const coordinator = p.coordinator_id ? lecturerMap.get(p.coordinator_id) : undefined;
  return {
    ...p,
    description,
    groupMembers,
    ownerName: owner?.full_name ?? null,
    ownerIndex: owner?.index_number ?? null,
    ownerEmail: owner?.email ?? null,
    ownerRegistrationDate: owner?.registration_date ?? null,
    supervisorName: supervisor?.full_name ?? null,
    coordinatorName: coordinator?.full_name ?? null,
  };
}

export function getProjectStudents(project: Record<string, any>): ProjectStudent[] {
  const students: ProjectStudent[] = [];

  if (project.owner_id || project.ownerIndex || project.ownerEmail || project.ownerName) {
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

/**
 * All projects a student is enrolled in: ones they own, plus group projects
 * where their index number or email is listed among the group members.
 */
export async function getEnrolledProjects(supabase: SupabaseClient, studentId: string) {
  // Resolve the student's identifiers used in group-member records.
  const { data: student } = await supabase
    .from('students')
    .select('id, index_number, email')
    .eq('id', studentId)
    .maybeSingle();

  const index = (student?.index_number ?? '').trim().toLowerCase();
  const email = (student?.email ?? '').trim().toLowerCase();

  // Owned projects.
  const { data: owned } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', studentId)
    .order('created_at', { ascending: false });

  // Group projects the student may be a member of (parsed from description).
  const { data: groupProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('project_type', 'group')
    .order('created_at', { ascending: false });

  const byId = new Map<string, Record<string, any>>();
  for (const p of owned ?? []) byId.set(p.id, p);

  for (const p of groupProjects ?? []) {
    if (byId.has(p.id)) continue;
    const { groupMembers } = parseDescription(p.description);
    const isMember = groupMembers.some(
      (m) =>
        (index && (m.indexNumber ?? '').trim().toLowerCase() === index) ||
        (email && (m.email ?? '').trim().toLowerCase() === email),
    );
    if (isMember) byId.set(p.id, p);
  }

  return enrichProjects(supabase, Array.from(byId.values()));
}
