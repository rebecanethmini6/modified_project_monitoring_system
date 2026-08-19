import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

const studentTableNames = ['students', 'student'];

export async function GET() {
  const supabase = createAdminSupabaseClient();

  for (const tableName of studentTableNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, full_name, index_number, email, registration_date')
      .order('index_number', { ascending: true });

    if (error) continue;

    return jsonResponse({
      ok: true,
      students: (data ?? []).map((s: Record<string, unknown>) => ({
        id: String(s.id ?? ''),
        fullName: String(s.full_name ?? ''),
        indexNumber: String(s.index_number ?? ''),
        email: String(s.email ?? ''),
        registrationDate: s.registration_date ? String(s.registration_date) : null,
      })),
    });
  }

  return errorResponse('Could not load student list.', 502);
}
