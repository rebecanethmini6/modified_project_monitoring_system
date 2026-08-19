import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { formatProjectRating, parseProjectRating } from '@/backend/ratings';
import { getProjectStudents, enrichProjects } from '@/backend/projects';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StudentRatingPayload = {
  studentKey: string;
  rating: number | string;
  notes?: string;
  ratedBy?: string;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;
    const body = await readJsonBody<StudentRatingPayload>(request);

    const parsedRating = parseProjectRating(body.rating);
    if (parsedRating === null) {
      return errorResponse('Rating must be a whole number from 1 to 10.', 400);
    }
    if (!body.ratedBy) {
      return errorResponse('Missing rater identity.', 400);
    }
    if (!body.studentKey) {
      return errorResponse('Missing student identity.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      return errorResponse(projectError.message, 502);
    }
    if (!project) {
      return errorResponse('Project not found.', 404);
    }

    const [enrichedProject] = await enrichProjects(supabase, [project]);
    const student = getProjectStudents(enrichedProject).find((item) => item.key === body.studentKey);
    if (!student) {
      return errorResponse('Student is not listed on this project.', 400);
    }

    const { data, error } = await supabase
      .from('project_student_ratings')
      .upsert(
        {
          project_id: projectId,
          student_key: student.key,
          student_name: student.name,
          index_number: student.indexNumber,
          email: student.email,
          role: student.role,
          rated_by: body.ratedBy,
          rating: formatProjectRating(parsedRating),
          notes: body.notes ?? null,
          rated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,student_key' },
      )
      .select('*')
      .single();

    if (error) {
      return errorResponse(error.message, 502);
    }

    return jsonResponse({ ok: true, rating: data }, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
