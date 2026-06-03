import { jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Fetch all registered lecturers from the 'lecturers' table
    const { data: lecturers, error } = await supabase
      .from('lecturers')
      .select('id, lecturer_id, full_name, email, department')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching lecturers:', error);
      return jsonResponse({ ok: false, error: error.message }, 502);
    }

    return jsonResponse({ ok: true, lecturers });
  } catch (error) {
    console.error('Unexpected error in GET /api/lecturers:', error);
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected error.',
      },
      500,
    );
  }
}
