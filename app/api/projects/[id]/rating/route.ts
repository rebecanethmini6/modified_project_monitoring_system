import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { formatProjectRating, parseProjectRating } from '@/backend/ratings';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RatingPayload = {
  rating: number | string;
  notes?: string;
  ratedBy?: string; // lecturer id
};

// Supervisor sets/updates the single overall rating for a project.
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;
    const body = await readJsonBody<RatingPayload>(request);

    const parsedRating = parseProjectRating(body.rating);
    if (parsedRating === null) {
      return errorResponse('Rating must be a whole number from 1 to 10.', 400);
    }
    if (!body.ratedBy) {
      return errorResponse('Missing rater identity.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('project_ratings')
      .upsert(
        {
          project_id: projectId,
          rated_by: body.ratedBy,
          rating: formatProjectRating(parsedRating),
          notes: body.notes ?? null,
          rated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id' },
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
