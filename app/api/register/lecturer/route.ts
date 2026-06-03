import { ensureRequiredFields, errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';
import type { LecturerRegistrationPayload } from '@/backend/contracts';

const departmentLabels: Record<string, string> = {
  cs: 'Computer Science',
  it: 'Information Technology',
  se: 'Software Engineering',
  ds: 'Data Science',
  math: 'Mathematics',
};

const lecturerTableNames = ['lecturers', 'lecturer'];

async function saveLecturerProfile(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  profile: Record<string, unknown>,
) {
  let lastError: Error | null = null;

  for (const tableName of lecturerTableNames) {
    const { error } = await supabase.from(tableName).upsert(profile, {
      onConflict: 'id',
    });

    if (!error) {
      return;
    }

    lastError = new Error(error.message);
  }

  throw lastError ?? new Error('Failed to save lecturer profile.');
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<LecturerRegistrationPayload>(request);
    ensureRequiredFields(body as Record<string, unknown>, [
      'lecturerId',
      'department',
      'fullName',
      'email',
      'contactNumber',
      'password',
    ]);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        role: 'lecturer',
        lecturer_id: body.lecturerId,
        department: body.department,
        department_label: departmentLabels[body.department] ?? body.department,
        full_name: body.fullName,
        contact_number: body.contactNumber,
      },
    });

    if (error || !data.user) {
      return errorResponse(error?.message ?? 'Failed to create lecturer account.', 502);
    }

    try {
      await saveLecturerProfile(supabase, {
        id: data.user.id,
        lecturer_id: body.lecturerId,
        department: departmentLabels[body.department] ?? body.department,
        full_name: body.fullName,
        email: body.email,
        contact_number: body.contactNumber,
      });
    } catch (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return errorResponse(
        profileError instanceof Error ? profileError.message : 'Failed to save lecturer profile.',
        502,
      );
    }

    return jsonResponse(
      {
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'lecturer',
        },
      },
      201,
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}
