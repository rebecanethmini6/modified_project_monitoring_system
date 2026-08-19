import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FeedbackPayload = {
  feedback: string;
  reviewedBy?: string; // lecturer id
};

// Supervisor leaves feedback on a submitted document.
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await readJsonBody<FeedbackPayload>(request);

    if (!body.feedback || !body.feedback.trim()) {
      return errorResponse('Feedback text is required.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('documents')
      .update({
        feedback: body.feedback,
        reviewed_by: body.reviewedBy ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return errorResponse(error.message, 502);
    }

    if (!data) {
      return errorResponse('Document not found.', 404);
    }

    return jsonResponse({ ok: true, document: data });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
