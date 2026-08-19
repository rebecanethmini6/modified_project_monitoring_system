import { ensureRequiredFields, errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient, getSupabaseStatus } from '@/backend/supabase';
import { enrichProjects, getEnrolledProjects } from '@/backend/projects';
import type { ProjectPayload } from '@/backend/contracts';
import { sendEmail } from '@/backend/email';

const departmentLabels: Record<string, string> = {
  cs: 'Computer Science',
  im: 'Industrial Management',
  ms: 'Mathematics and Statistics',
  ee: 'Electronics',
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');
    const supervisorId = url.searchParams.get('supervisorId');
    const coordinatorId = url.searchParams.get('coordinatorId');
    // Returns every project a student is enrolled in: ones they own (individual
    // or group owner) AND group projects where they are listed as a member.
    const enrolledStudentId = url.searchParams.get('enrolledStudentId');

    const supabase = createAdminSupabaseClient();

    if (enrolledStudentId) {
      const projects = await getEnrolledProjects(supabase, enrolledStudentId);
      return jsonResponse({ ok: true, projects });
    }

    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (ownerId) query = query.eq('owner_id', ownerId);
    if (supervisorId) query = query.eq('supervisor_id', supervisorId);
    if (coordinatorId) query = query.eq('coordinator_id', coordinatorId);

    const { data, error } = await query;

    if (error) {
      return errorResponse(error.message, 502);
    }

    const projects = await enrichProjects(supabase, data ?? []);
    return jsonResponse({ ok: true, projects });
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
        coordinatorId?: string;
        groupMembers?: Array<{ indexNumber: string; email: string }>;
        proposalPath?: string;
        proposalFilename?: string;
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

    // 0. Ensure the owner exists in the students table (projects.owner_id is a
    //    FK to students.id). If the student profile row is missing — e.g. the
    //    account was created while credentials were misconfigured — recreate it
    //    from the auth user's metadata so submission doesn't fail.
    const ownerId = body.ownerId as string;
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle();

    if (!existingStudent) {
      const { data: authUserData, error: authUserError } =
        await supabase.auth.admin.getUserById(ownerId);

      const authUser = authUserData?.user;
      if (authUserError || !authUser) {
        return errorResponse(
          'Your account is not registered as a student. Please register or log in as a student before submitting a project.',
          400,
        );
      }

      const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
      if (meta.role && meta.role !== 'student') {
        return errorResponse(
          'Only student accounts can submit project proposals.',
          403,
        );
      }

      const { error: studentInsertError } = await supabase.from('students').upsert(
        {
          id: ownerId,
          email: authUser.email ?? `${ownerId}@unknown.local`,
          full_name: (meta.full_name as string) ?? authUser.email ?? 'Unknown Student',
          index_number: (meta.index_number as string) ?? ownerId,
          combination:
            (meta.combination_label as string) ?? (meta.combination as string) ?? 'Unknown',
          academic_year:
            (meta.academic_year_label as string) ?? (meta.academic_year as string) ?? 'Unknown',
          contact_number: (meta.contact_number as string) ?? null,
        },
        { onConflict: 'id' },
      );

      if (studentInsertError) {
        return errorResponse(
          `Could not link your student profile: ${studentInsertError.message}`,
          502,
        );
      }
    }

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
        coordinator_id: body.coordinatorId || null,
        submitted_date: new Date().toISOString().split('T')[0],
      })
      .select('*')
      .single();

    if (error) {
      return errorResponse(error.message, 502);
    }

    // 1b. Record the uploaded proposal document (if any) in the documents table.
    if (body.proposalPath && body.proposalFilename) {
      const { error: documentError } = await supabase.from('documents').insert({
        project_id: project.id,
        uploaded_by: body.ownerId,
        file_name: body.proposalFilename,
        description: 'Initial project proposal document',
        storage_path: body.proposalPath,
      });

      if (documentError) {
        // The project was created; surface the document failure without losing it.
        return errorResponse(
          `Project created but proposal document could not be saved: ${documentError.message}`,
          502,
        );
      }
    }

    // 2. Fetch owner (student) details
    let studentName = 'A student';
    let studentEmail: string | null = null;
    if (body.ownerId) {
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, email')
        .eq('id', body.ownerId)
        .maybeSingle();
      if (studentData?.full_name) studentName = studentData.full_name;
      if (studentData?.email) studentEmail = studentData.email;
    }

    const departmentLabel = departmentLabels[body.department] ?? body.department;
    const projectTypeLabel = body.type === 'group' ? 'Group Project' : 'Individual Project';

    // 3a. Confirm to the project owner (the student who submitted)
    if (studentEmail) {
      try {
        await sendEmail({
          to: studentEmail,
          toName: studentName,
          subject: `✅ Project Submitted: ${body.title}`,
          body: `Dear ${studentName},

Your project proposal has been successfully submitted.

Project Details:
  Title       : ${body.title}
  Type        : ${projectTypeLabel}
  Department  : ${departmentLabel}

Your proposal is now pending coordinator review. You will be notified once a supervisor has been assigned.

Best regards,
Wayamba University of Sri Lanka — Project Monitoring System`,
          html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
  <div style="background:#1E3A8A;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
    <h2 style="margin:0;font-size:18px">Project Proposal Submitted</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:.85">Wayamba University of Sri Lanka</p>
  </div>
  <p>Dear <strong>${studentName}</strong>,</p>
  <p>Your project proposal has been <strong>successfully submitted</strong> and is pending coordinator review.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151;width:140px">Title</td><td style="padding:10px 12px">${body.title}</td></tr>
    <tr><td style="padding:10px 12px;font-weight:600;color:#374151">Type</td><td style="padding:10px 12px">${projectTypeLabel}</td></tr>
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151">Department</td><td style="padding:10px 12px">${departmentLabel}</td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px">You will receive another notification once a supervisor has been assigned to your project.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af;margin:0">Wayamba University of Sri Lanka — Project Monitoring System</p>
</div>`,
          templateId: 'template_ju5zdhl',
          templateParams: {
            projectTitle: body.title,
            studentName,
            coordinatorName: 'Pending Assignment',
          },
        });
      } catch (e) {
        console.error('[email] owner confirmation failed:', e);
      }
    }

    // 3b. Notify group members (if group project)
    if (body.type === 'group' && groupMembersList.length > 0) {
      for (const member of groupMembersList) {
        if (member.email) {
          try {
            await sendEmail({
              to: member.email,
              subject: `📋 Group Project Invitation: ${body.title}`,
              body: `Dear Student,

You have been added as a group member to a new project proposal titled "${body.title}" submitted by ${studentName}.

Project Details:
  Title      : ${body.title}
  Department : ${departmentLabel}
  Objectives : ${body.objectives}

Please log in to the Project Monitoring System to view full details.

Best regards,
Wayamba University of Sri Lanka — Project Monitoring System`,
            html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
  <div style="background:#4F46E5;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
    <h2 style="margin:0;font-size:18px">Group Project Invitation</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:.85">Wayamba University of Sri Lanka</p>
  </div>
  <p>Dear Student,</p>
  <p>You have been added as a <strong>group member</strong> to a new project proposal by <strong>${studentName}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151;width:140px">Title</td><td style="padding:10px 12px">${body.title}</td></tr>
    <tr><td style="padding:10px 12px;font-weight:600;color:#374151">Department</td><td style="padding:10px 12px">${departmentLabel}</td></tr>
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151">Objectives</td><td style="padding:10px 12px">${body.objectives}</td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px">Log in to the Project Monitoring System to view full project details.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af;margin:0">Wayamba University of Sri Lanka — Project Monitoring System</p>
</div>`,
            templateId: 'template_ju5zdhl',
            templateParams: {
              projectTitle: body.title,
              studentName,
              coordinatorName: 'Pending Assignment',
            },
          });
          } catch (e) {
            console.error('[email] group member invitation failed:', e);
          }
        }
      }
    }

    // 4. Notify the chosen coordinator that a proposal needs a supervisor assignment.
    if (body.coordinatorId) {
      const { data: coordinatorData } = await supabase
        .from('lecturers')
        .select('full_name, email')
        .eq('id', body.coordinatorId)
        .maybeSingle();

      if (coordinatorData?.email) {
        try {
          await sendEmail({
            to: coordinatorData.email,
            toName: coordinatorData.full_name ?? undefined,
          subject: `📌 New Project Proposal Awaiting Supervisor Assignment: ${body.title}`,
          body: `Dear ${coordinatorData.full_name ?? 'Coordinator'},

A new project proposal titled "${body.title}" submitted by ${studentName} has been assigned to you as coordinator.

Project Details:
  Title      : ${body.title}
  Type       : ${projectTypeLabel}
  Department : ${departmentLabel}
  Description: ${body.description}

Please log in to the Faculty Portal to review the proposal and assign an academic supervisor.

Best regards,
Wayamba University of Sri Lanka — Project Monitoring System`,
          html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
  <div style="background:#1E3A8A;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
    <h2 style="margin:0;font-size:18px">New Project Proposal — Action Required</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:.85">Wayamba University of Sri Lanka</p>
  </div>
  <p>Dear <strong>${coordinatorData.full_name ?? 'Coordinator'}</strong>,</p>
  <p>A new project proposal has been assigned to you as coordinator and is <strong>awaiting supervisor assignment</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151;width:140px">Title</td><td style="padding:10px 12px">${body.title}</td></tr>
    <tr><td style="padding:10px 12px;font-weight:600;color:#374151">Submitted by</td><td style="padding:10px 12px">${studentName}</td></tr>
    <tr style="background:#f8fafc"><td style="padding:10px 12px;font-weight:600;color:#374151">Type</td><td style="padding:10px 12px">${projectTypeLabel}</td></tr>
    <tr><td style="padding:10px 12px;font-weight:600;color:#374151">Department</td><td style="padding:10px 12px">${departmentLabel}</td></tr>
  </table>
  <p style="color:#6b7280;font-size:13px">Please log in to the <strong>Faculty Portal</strong> to review and assign a supervisor.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af;margin:0">Wayamba University of Sri Lanka — Project Monitoring System</p>
</div>`,
          templateId: 'template_ju5zdhl',
          templateParams: {
            projectTitle: body.title,
            studentName,
            coordinatorName: coordinatorData.full_name ?? 'Coordinator',
          },
        });
      } catch (e) {
        console.error('[email] coordinator notification failed:', e);
      }
      }
    }

    return jsonResponse({ ok: true, project }, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
