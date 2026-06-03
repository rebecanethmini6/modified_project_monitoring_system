import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

type ConfirmEmailPayload = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<ConfirmEmailPayload>(request);
    const email = body.email?.trim();

    if (!email) {
      return errorResponse('Email is required.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return errorResponse(error.message, 502);
    }

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return errorResponse('User not found.', 404);
    }

    const updateResult = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateResult.error) {
      return errorResponse(updateResult.error.message, 502);
    }

    return jsonResponse(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          confirmed: true,
        },
      },
      200,
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}