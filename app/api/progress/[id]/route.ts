import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { formatProjectRating, parseProjectRating } from '@/backend/ratings';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type GradePayload = {
  rating?: number | string;
  feedback?: string;
  ratedBy?: string; // lecturer id
};

// Supervisor grades / gives feedback on a single progress entry.
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await readJsonBody<GradePayload>(request);

    if (!body.rating && !body.feedback) {
      return errorResponse('A rating or feedback is required.', 400);
    }

    const parsedRating = body.rating !== undefined ? parseProjectRating(body.rating) : null;
    if (body.rating !== undefined && parsedRating === null) {
      return errorResponse('Rating must be a whole number from 1 to 10.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('progress_entries')
      .update({
        rating: parsedRating !== null ? formatProjectRating(parsedRating) : null,
        feedback: body.feedback ?? null,
        rated_by: body.ratedBy ?? null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return errorResponse(error.message, 502);
    }

    if (!data) {
      return errorResponse('Progress entry not found.', 404);
    }

    return jsonResponse({ ok: true, progress: data });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
