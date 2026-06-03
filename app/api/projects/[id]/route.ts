import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

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

    let supervisor = null;
    if (data.supervisor_id) {
      const { data: supData } = await supabase
        .from('lecturers')
        .select('id, full_name, email, department')
        .eq('id', data.supervisor_id)
        .maybeSingle();
      if (supData) {
        supervisor = {
          id: supData.id,
          fullName: supData.full_name,
          email: supData.email,
          department: supData.department,
        };
      }
    }

    return jsonResponse({ ok: true, project: { ...data, supervisor } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .update(body)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return errorResponse(error.message, 502);
    }

    if (!data) {
      return errorResponse('Project not found.', 404);
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
