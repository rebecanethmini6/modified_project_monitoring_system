import { ensureRequiredFields, errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';
import type { StudentRegistrationPayload } from '@/backend/contracts';

const combinationLabels: Record<string, string> = {
  cs: 'Computer Science',
  'cs-math': 'Computer Science & Mathematics',
  is: 'Information Systems',
  se: 'Software Engineering',
  ds: 'Data Science',
};

const academicYearLabels: Record<string, string> = {
  '1': 'Year 1',
  '2': 'Year 2',
  '3': 'Year 3',
  '4': 'Year 4',
};

const studentTableName = 'students';

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
      'combination',
      'academicYear',
      'contactNumber',
      'password',
    ]);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        full_name: body.fullName,
        index_number: body.indexNumber,
        combination: body.combination,
        combination_label: combinationLabels[body.combination] ?? body.combination,
        academic_year: body.academicYear,
        academic_year_label: academicYearLabels[body.academicYear] ?? body.academicYear,
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
        combination: combinationLabels[body.combination] ?? body.combination,
        academic_year: academicYearLabels[body.academicYear] ?? body.academicYear,
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
