import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';
import { getAcademicBatch, getCurrentAcademicYear, getCurrentStudyYear, normalizeRegistrationDate } from '@/frontend/lib/academic';

const studentTableNames = ['students', 'student'];

function toStudentProfile(row: Record<string, unknown>, fallbackRegistrationDate?: unknown) {
  const registrationDate = normalizeRegistrationDate(row.registration_date ?? fallbackRegistrationDate);
  return {
    userId: String(row.id ?? ''),
    email: String(row.email ?? ''),
    fullName: String(row.full_name ?? ''),
    indexNumber: String(row.index_number ?? ''),
    registrationDate,
    admissionBatch: registrationDate ? getAcademicBatch(registrationDate) : '',
    currentAcademicYear: registrationDate ? getCurrentAcademicYear() : '',
    currentStudyYear: registrationDate ? getCurrentStudyYear(registrationDate) : '',
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
        const row = data as Record<string, unknown>;
        const { data: authData } = await supabase.auth.admin.getUserById(String(row.id));
        const metadata = (authData.user?.user_metadata ?? {}) as Record<string, unknown>;
        const fallbackRegistrationDate = metadata.registration_date;
        const registrationDate = normalizeRegistrationDate(row.registration_date ?? fallbackRegistrationDate);

        // Backfill accounts that were created before registration_date existed.
        if (!row.registration_date && registrationDate && tableName === 'students') {
          await supabase.from('students').update({ registration_date: registrationDate }).eq('id', row.id);
        }

        return jsonResponse({ ok: true, student: toStudentProfile(row, fallbackRegistrationDate) });
      }
    }

    return errorResponse('Student profile not found.', 404);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
