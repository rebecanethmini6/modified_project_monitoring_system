import { ensureRequiredFields, errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';
import type { StudentRegistrationPayload } from '@/backend/contracts';

const studentTableName = 'students';
const MIN_REGISTRATION_YEAR = 2023;
const MAX_REGISTRATION_YEAR = 2026;

async function saveStudentProfile(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  profile: Record<string, unknown>,
) {
  const { error } = await supabase.from(studentTableName).upsert(profile, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<StudentRegistrationPayload>(request);
    ensureRequiredFields(body as Record<string, unknown>, [
      'fullName',
      'indexNumber',
      'email',
      'registrationDate',
      'contactNumber',
      'password',
    ]);

    const dateMatch = /^(\d{4})-\d{2}-\d{2}$/.exec(body.registrationDate);
    const registrationYear = dateMatch ? Number(dateMatch[1]) : Number.NaN;
    if (!Number.isInteger(registrationYear) || registrationYear < MIN_REGISTRATION_YEAR || registrationYear > MAX_REGISTRATION_YEAR) {
      return errorResponse(`Registration year must be between ${MIN_REGISTRATION_YEAR} and ${MAX_REGISTRATION_YEAR}.`, 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        full_name: body.fullName,
        index_number: body.indexNumber,
        registration_date: body.registrationDate,
        contact_number: body.contactNumber,
      },
    });

    if (error || !data.user) {
      return errorResponse(error?.message ?? 'Failed to create student account.', 502);
    }

    try {
      await saveStudentProfile(supabase, {
        id: data.user.id,
        email: body.email,
        full_name: body.fullName,
        index_number: body.indexNumber,
        registration_date: body.registrationDate,
        contact_number: body.contactNumber,
      });
    } catch (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return errorResponse(
        profileError instanceof Error ? profileError.message : 'Failed to save student profile.',
        502,
      );
    }

    return jsonResponse(
      {
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'student',
        },
      },
      201,
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
