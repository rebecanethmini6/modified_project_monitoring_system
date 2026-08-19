import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProgressPayload = {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  nextSteps?: string;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;
    const body = await readJsonBody<ProgressPayload>(request);

    if (!body.title || !body.title.trim()) {
      return errorResponse('A milestone title is required.', 400);
    }

    const supabase = createAdminSupabaseClient();

    // Next activity number = current max + 1 (table enforces uniqueness).
    const { data: existing } = await supabase
      .from('progress_entries')
      .select('activity_number')
      .eq('project_id', projectId)
      .order('activity_number', { ascending: false })
      .limit(1);

    const nextActivityNumber = (existing?.[0]?.activity_number ?? 0) + 1;

    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        project_id: projectId,
        activity_number: nextActivityNumber,
        title: body.title,
        description: body.description ?? null,
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        next_steps: body.nextSteps ?? null,
      })
      .select('*')
      .single();

    if (error) {
      return errorResponse(error.message, 502);
    }

    return jsonResponse({ ok: true, progress: data }, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
