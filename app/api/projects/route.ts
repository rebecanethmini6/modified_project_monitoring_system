import { ensureRequiredFields, errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient, getSupabaseStatus } from '@/backend/supabase';
import type { ProjectPayload } from '@/backend/contracts';
import { sendMockEmail } from '@/backend/email';

const departmentLabels: Record<string, string> = {
  cs: 'Computer Science',
  it: 'Information Technology',
  se: 'Software Engineering',
  ds: 'Data Science',
  math: 'Mathematics',
};

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(error.message, 502);
    }

    return jsonResponse({ ok: true, projects: data });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected error.',
        supabase: getSupabaseStatus(),
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<
      ProjectPayload & {
        ownerId?: string;
        supervisorId?: string;
        groupMembers?: Array<{ indexNumber: string; email: string }>;
      }
    >(request);

    ensureRequiredFields(body as Record<string, unknown>, [
      'department',
      'title',
      'type',
      'description',
      'aims',
      'objectives',
      'ownerId',
    ]);

    const supabase = createAdminSupabaseClient();

    // 1. Serialize group members metadata into description if group project
    const groupMembersList = body.type === 'group' ? (body.groupMembers || []) : [];
    const serializedDescription = body.description + '\n\n===METADATA===\n' + JSON.stringify({ groupMembers: groupMembersList });

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: body.title,
        description: serializedDescription,
        aims: body.aims,
        objectives: body.objectives,
        department: departmentLabels[body.department] ?? body.department,
        project_type: body.type,
        status: 'pending',
        progress: 0,
        owner_id: body.ownerId,
        supervisor_id: body.supervisorId || null,
        submitted_date: new Date().toISOString().split('T')[0],
      })
      .select('*')
      .single();

    if (error) {
      return errorResponse(error.message, 502);
    }

    // 2. Fetch owner (student) details to write a nice email
    let studentName = 'A student';
    if (body.ownerId) {
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name')
        .eq('id', body.ownerId)
        .maybeSingle();
      if (studentData?.full_name) {
        studentName = studentData.full_name;
      }
    }

    // 3. Send emails to group members automatically
    if (body.type === 'group' && groupMembersList.length > 0) {
      for (const member of groupMembersList) {
        if (member.email) {
          await sendMockEmail({
            to: member.email,
            subject: `Group Project Invitation: ${body.title}`,
            body: `Dear Student,

You have been added as a group member to a new project proposal titled "${body.title}" by ${studentName}.

Project Details:
- Title: ${body.title}
- Department: ${departmentLabels[body.department] ?? body.department}
- Objectives: ${body.objectives}

Please log in to the Project Monitoring System to view details.

Best regards,
University Project Portal`
          });
        }
      }
    }

    // 4. Send email to supervisor if assigned and registered
    if (body.supervisorId) {
      const { data: supervisorData } = await supabase
        .from('lecturers')
        .select('full_name, email')
        .eq('id', body.supervisorId)
        .maybeSingle();

      if (supervisorData && supervisorData.email) {
        await sendMockEmail({
          to: supervisorData.email,
          subject: `New Project Supervision Assignment: ${body.title}`,
          body: `Dear Dr./Prof. ${supervisorData.full_name},

You have been assigned as the supervisor for a new project proposal titled "${body.title}" submitted by ${studentName}.

Project Details:
- Title: ${body.title}
- Type: ${body.type === 'group' ? 'Group Project' : 'Individual Project'}
- Department: ${departmentLabels[body.department] ?? body.department}
- Description: ${body.description}

Please log in to the Faculty Portal to review the proposal and evaluate milestones.

Best regards,
University Project Portal`
        });
      }
    }

    return jsonResponse({ ok: true, project }, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
