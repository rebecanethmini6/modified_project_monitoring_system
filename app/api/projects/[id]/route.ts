import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';
import { enrichProjects, parseDescription } from '@/backend/projects';
import { sendEmail } from '@/backend/email';

const STORAGE_BUCKET = 'proposals';

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ProjectRouteContext) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();

    if (error) {
      return errorResponse(error.message, 502);
    }

    if (!data) {
      return errorResponse('Project not found.', 404);
    }

    // Enrich with owner/supervisor/coordinator names and parsed group members.
    const [enriched] = await enrichProjects(supabase, [data]);

    // Progress entries (oldest first by activity number).
    const { data: progressEntries } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('project_id', id)
      .order('activity_number', { ascending: true });

    // Documents with public download URLs.
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    const documentsWithUrls = (documents ?? []).map((doc) => {
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(doc.storage_path);
      return { ...doc, url: pub.publicUrl };
    });

    const { data: overallRating } = await supabase
      .from('project_ratings')
      .select('rating, notes, rated_at')
      .eq('project_id', id)
      .maybeSingle();

    const { data: studentRatings } = await supabase
  .from('project_student_ratings')
  .select('student_key, rating')
  .eq('project_id', id);

    return jsonResponse({
      ok: true,
      project: {
        ...enriched,
        // Backwards-compatible nested supervisor object used by the UI.
        supervisor: enriched.supervisorName
          ? { id: data.supervisor_id, fullName: enriched.supervisorName }
          : null,
        progressEntries: progressEntries ?? [],
        documents: documentsWithUrls,
        overallRating: overallRating?.rating ?? null,
        overallRatingNotes: overallRating?.notes ?? null,
        overallRatedAt: overallRating?.rated_at ?? null,
        studentRatings: studentRatings ?? [],
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminSupabaseClient();

    // Assigning a supervisor moves the project into active supervision.
    const isAssigningSupervisor = typeof body.supervisor_id === 'string' && body.supervisor_id;
    const updatePayload: Record<string, unknown> = { ...body };
    if (isAssigningSupervisor) {
      updatePayload.status = body.status ?? 'in_progress';
      updatePayload.start_date = body.start_date ?? new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return errorResponse(error.message, 502);
    }

    if (!data) {
      return errorResponse('Project not found.', 404);
    }

    // ── Supervisor-assignment emails ──────────────────────────────────────────
    if (isAssigningSupervisor) {
      const supervisorId = body.supervisor_id as string;

      // Fetch supervisor details
      const { data: supervisorData } = await supabase
        .from('lecturers')
        .select('full_name, email')
        .eq('id', supervisorId)
        .maybeSingle();

      const supervisorName = supervisorData?.full_name ?? 'the assigned supervisor';

      // Fetch owner (student) details
      let ownerData = null;
      if (data.owner_id) {
        const { data: studentData } = await supabase
          .from('students')
          .select('full_name, email')
          .eq('id', data.owner_id)
          .maybeSingle();
        ownerData = studentData;
      }
      
      const studentName = ownerData?.full_name ?? 'Student';

      // 1. Notify the supervisor
      if (supervisorData?.email) {
        try {
          await sendEmail({
            to: supervisorData.email,
            toName: supervisorData.full_name ?? 'Supervisor',
            subject: `New Project Assignment: ${data.title}`,
            body: `Dear ${supervisorData.full_name ?? 'Supervisor'},

You have been assigned as the supervisor for the project "${data.title}" submitted by ${studentName}.

Please log in to the portal to view the details.

Best regards,
University Project Monitoring System`,
            templateId: 'template_ybwvu3y',
            templateParams: {
              projectTitle: data.title,
              studentName,
              supervisorName,
            },
          });
        } catch(e) {
          console.error('[email] supervisor notification failed:', e);
        }
      }

      // 2. Notify the project owner (student)
      if (ownerData?.email) {
        try {
          await sendEmail({
            to: ownerData.email,
            toName: studentName,
            subject: `Supervisor Assigned: ${data.title}`,
            body: `Dear ${studentName},

A supervisor (${supervisorName}) has been assigned to your project "${data.title}".

Please log in to the portal to view the details.

Best regards,
University Project Monitoring System`,
            templateId: 'template_ybwvu3y',
            templateParams: {
              projectTitle: data.title,
              studentName,
              supervisorName,
            },
          });
        } catch(e) {
          console.error('[email] owner notification failed:', e);
        }
      }

      // 3. Notify group members (if group project)
      if (data.project_type === 'group') {
        const { groupMembers } = parseDescription(data.description);
        for (const member of groupMembers) {
          if (member.email) {
            try {
              await sendEmail({
                to: member.email,
                toName: 'Student',
                subject: `Supervisor Assigned: ${data.title}`,
                body: `Dear Student,

A supervisor (${supervisorName}) has been assigned to your group project "${data.title}".

Please log in to the portal to view the details.

Best regards,
University Project Monitoring System`,
                templateId: 'template_ybwvu3y',
                templateParams: {
                  projectTitle: data.title,
                  studentName,
                  supervisorName,
                },
              });
            } catch (e) {
              console.error(`[email] group member ${member.email} supervisor-assigned failed:`, e);
            }
          }
        }
      }
    }

    return jsonResponse({ ok: true, project: data });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}

export async function DELETE(_request: Request, { params }: ProjectRouteContext) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      return errorResponse(error.message, 502);
    }

    return jsonResponse({ ok: true, deleted: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
