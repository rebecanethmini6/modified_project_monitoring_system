import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

const lecturerTableNames = ['lecturers', 'lecturer'];

function toLecturerProfile(row: Record<string, unknown>) {
  return {
    userId: String(row.id ?? ''),
    lecturerId: String(row.lecturer_id ?? ''),
    fullName: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    department: String(row.department_label ?? row.department ?? ''),
    contactNumber: String(row.contact_number ?? ''),
    role: String(row.role ?? 'lecturer'),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId')?.trim();
    const email = url.searchParams.get('email')?.trim();

    if (!userId && !email) {
      return errorResponse('userId or email is required.', 400);
    }

    const supabase = createAdminSupabaseClient();

    for (const tableName of lecturerTableNames) {
      let query = supabase.from(tableName).select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        continue;
      }

      if (data) {
        return jsonResponse({ ok: true, lecturer: toLecturerProfile(data as Record<string, unknown>) });
      }
    }

    return errorResponse('Lecturer profile not found.', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}