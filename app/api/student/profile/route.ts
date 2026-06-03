import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

const studentTableNames = ['students', 'student'];

function toStudentProfile(row: Record<string, unknown>) {
  return {
    userId: String(row.id ?? ''),
    email: String(row.email ?? ''),
    fullName: String(row.full_name ?? ''),
    indexNumber: String(row.index_number ?? ''),
    combination: String(row.combination_label ?? row.combination ?? ''),
    academicYear: String(row.academic_year_label ?? row.academic_year ?? ''),
    contactNumber: String(row.contact_number ?? ''),
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

    for (const tableName of studentTableNames) {
      let query = supabase.from(tableName).select('*');

      if (userId) {
        query = query.eq('id', userId);
      } else if (email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        continue;
      }

      if (data) {
        return jsonResponse({ ok: true, student: toStudentProfile(data as Record<string, unknown>) });
      }
    }

    return errorResponse('Student profile not found.', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}